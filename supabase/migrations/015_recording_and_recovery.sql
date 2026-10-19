-- Additive Release 1 recording model: preserve IDs, actuals, historical categories and plans.
begin;
alter table public.expected_payments add column if not exists expected_date date check(expected_date between '1900-01-01' and '2100-12-31');
create table if not exists public.removed_entries (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 category_id uuid not null, subcategory_id uuid, named_goal_id uuid, expected_payment_id uuid,
 entry jsonb not null, removed_at timestamptz not null default now(),
 foreign key(category_id,user_id) references public.categories(id,user_id),
 foreign key(subcategory_id,user_id,category_id) references public.subcategories(id,user_id,category_id),
 foreign key(named_goal_id,user_id) references public.named_goals(id,user_id),
 foreign key(expected_payment_id,user_id) references public.expected_payments(id,user_id),
 check((entry->>'id')::uuid=id and (entry->>'user_id')::uuid=user_id)
);
alter table public.removed_entries enable row level security;
drop policy if exists own_removed_entries on public.removed_entries;
create policy own_removed_entries on public.removed_entries for select to authenticated using(user_id=auth.uid());
revoke all on public.removed_entries from public,anon,authenticated;
grant select on public.removed_entries to authenticated;

create or replace function public.remove_recorded_entry(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); e public.entries;
begin
 if owner_id is null then raise exception 'Sign in to remove an entry'; end if;
 select * into e from public.entries where id=p_id and user_id=owner_id for update;
 if not found then
  if exists(select 1 from public.removed_entries where id=p_id and user_id=owner_id) then return; end if;
  raise exception 'Entry no longer exists. Refresh Money Log';
 end if;
 insert into public.removed_entries(id,user_id,category_id,subcategory_id,named_goal_id,expected_payment_id,entry)
 values(e.id,owner_id,e.category_id,e.subcategory_id,e.named_goal_id,e.expected_payment_id,to_jsonb(e));
 -- Existing planning trigger rejects removals that would make goal progress negative.
 delete from public.entries where id=e.id and user_id=owner_id;
end $$;
create or replace function public.restore_recorded_entry(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); r public.removed_entries; e public.entries;
begin
 if owner_id is null then raise exception 'Sign in to restore an entry'; end if;
 select * into r from public.removed_entries where id=p_id and user_id=owner_id for update;
 if not found then
  if exists(select 1 from public.entries where id=p_id and user_id=owner_id) then return; end if;
  raise exception 'Removed entry not found';
 end if;
 select * into e from jsonb_populate_record(null::public.entries,r.entry);
 if e.user_id<>owner_id or e.id<>p_id then raise exception 'Invalid recovery record'; end if;
 if exists(select 1 from public.categories where id=e.category_id and archived) or exists(select 1 from public.subcategories where id=e.subcategory_id and archived) then raise exception 'Restore the archived category or subcategory in Categories first, then retry'; end if;
 if exists(select 1 from public.expected_payments where id=e.expected_payment_id and cancelled) then raise exception 'Reopen the cancelled expected payment first, then retry restoration'; end if;
 -- Insert invokes the same money/relationship/goal checks as every other entry.
 insert into public.entries select e.*;
 delete from public.removed_entries where id=p_id and user_id=owner_id;
end $$;
-- A restore mechanism is mandatory for ordinary user removals. Account cascade remains intact.
revoke delete on public.entries from authenticated;

create or replace function public.save_goal_with_entries(p_goal jsonb,p_start date,p_end date,p_amount bigint,p_entry_ids uuid[],p_legacy_id uuid default null) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); goal_id uuid:=(p_goal->>'id')::uuid; e public.entries; g public.named_goals; count_ids integer;
begin
 if owner_id is null then raise exception 'Sign in to save a goal'; end if;
 if cardinality(p_entry_ids)>500 then raise exception 'Select at most 500 existing records at a time'; end if;
 select count(distinct x) into count_ids from unnest(p_entry_ids) x;
 if count_ids<>cardinality(p_entry_ids) then raise exception 'Select each record once'; end if;
 perform public.save_named_goal(case when p_legacy_id is null then p_goal else p_goal||jsonb_build_object('legacy_goal_id',p_legacy_id) end,p_start,p_end,p_amount);
 select * into g from public.named_goals where id=goal_id and user_id=owner_id for update;
 if not found then raise exception 'Choose an owned goal'; end if;
 -- Lock selected records in ID order before linking; conditional attribution never overwrites another goal.
 perform 1 from public.entries where id=any(p_entry_ids) and user_id=owner_id order by id for update;
 if (select count(*) from public.entries where id=any(p_entry_ids) and user_id=owner_id)<>count_ids then raise exception 'One of these entries no longer exists'; end if;
 for e in select * from public.entries where id=any(p_entry_ids) and user_id=owner_id order by withdrawal,id loop
  if e.named_goal_id is not null and e.named_goal_id<>goal_id then raise exception 'An entry is already linked to another goal. Refresh before linking'; end if;
  if e.currency<>g.currency or not exists(select 1 from public.categories where id=e.category_id and user_id=owner_id and kind=g.funding_kind) then raise exception 'Entry currency and funding type must match this goal'; end if;
  update public.entries set named_goal_id=goal_id where id=e.id and user_id=owner_id;
 end loop;
end $$;
create or replace function public.match_expected_receipt(p_entry_id uuid,p_payment_id uuid) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); e public.entries;
begin
 if owner_id is null then raise exception 'Sign in to match a receipt'; end if;
 select * into e from public.entries where id=p_entry_id and user_id=owner_id for update;
 if not found then raise exception 'Choose an owned income entry'; end if;
 if e.expected_payment_id=p_payment_id then return; end if;
 if e.expected_payment_id is not null then raise exception 'This income entry already matches another payment'; end if;
 -- Existing trigger validates owner, income category, source and currency atomically.
 update public.entries set expected_payment_id=p_payment_id where id=e.id and user_id=owner_id;
end $$;
revoke all on function public.remove_recorded_entry(uuid),public.restore_recorded_entry(uuid),public.save_goal_with_entries(jsonb,date,date,bigint,uuid[],uuid),public.match_expected_receipt(uuid,uuid) from public,anon;
grant execute on function public.remove_recorded_entry(uuid),public.restore_recorded_entry(uuid),public.save_goal_with_entries(jsonb,date,date,bigint,uuid[],uuid),public.match_expected_receipt(uuid,uuid) to authenticated;
create or replace function public.save_income_source(p_source jsonb,p_payment jsonb default null) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); s public.income_sources; p public.expected_payments; begin
 if owner_id is null then raise exception 'Sign in to save an income source'; end if;
 perform 1 from profiles where user_id=owner_id for update;
 select * into s from jsonb_populate_record(null::public.income_sources,p_source);
 insert into income_sources(id,user_id,name,category_id,pattern,currency,archived) values(s.id,owner_id,s.name,s.category_id,s.pattern,s.currency,s.archived)
 on conflict(id) do update set name=excluded.name,category_id=excluded.category_id,pattern=excluded.pattern,currency=excluded.currency,archived=excluded.archived;
 if p_payment is not null then
 select * into p from jsonb_populate_record(null::public.expected_payments,p_payment);
 insert into expected_payments(id,user_id,source_id,category_id,name,currency,amount_minor,period_start,period_end,cancelled,expected_date)
 values(p.id,owner_id,s.id,s.category_id,p.name,p.currency,p.amount_minor,p.period_start,p.period_end,false,p.expected_date)
 on conflict(id) do update set name=excluded.name,amount_minor=excluded.amount_minor,expected_date=excluded.expected_date;
 end if; end $$;
commit;
