-- Additive 2.0 model. Old clients can continue recording unassigned entries.
begin;
create table public.accounts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 80), type text not null check(type in ('cash','bank','savings','investment','credit')),
 currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
 opening_minor bigint not null default 0 check(abs(opening_minor)<=1000000000000), opening_date date not null check(opening_date between '1900-01-01' and '2100-12-31'), archived boolean not null default false,
 unique(id,user_id)
);
alter table public.entries add column account_id uuid, add column funding_transfer_id uuid;
alter table public.entries add foreign key(account_id,user_id) references public.accounts(id,user_id);
create table public.account_transfers (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 from_account_id uuid not null,to_account_id uuid not null,currency text not null,amount_minor bigint not null check(amount_minor between 1 and 1000000000000),
 date date not null check(date between '1900-01-01' and '2100-12-31'),notes text not null default '' check(length(notes)<=500), allocation_entry_id uuid,removed_at timestamptz,
 check(from_account_id<>to_account_id),foreign key(from_account_id,user_id) references public.accounts(id,user_id),foreign key(to_account_id,user_id) references public.accounts(id,user_id),unique(id,user_id)
);
alter table public.entries add foreign key(funding_transfer_id,user_id) references public.account_transfers(id,user_id) deferrable initially deferred;
create table public.recurring_schedules (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null check(length(trim(name)) between 1 and 80),
 kind text not null check(kind in ('income','expense')),category_id uuid not null,account_id uuid,currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),amount_minor bigint not null check(amount_minor between 1 and 1000000000000),
 start_date date not null check(start_date between '1900-01-01' and '2100-12-31'),end_date date check(end_date between start_date and '2100-12-31'),frequency text not null check(frequency in ('weekly','monthly','yearly')),archived boolean not null default false,
 foreign key(category_id,user_id) references public.categories(id,user_id),foreign key(account_id,user_id) references public.accounts(id,user_id),unique(id,user_id)
);
create table public.recurring_occurrences (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,schedule_id uuid not null,scheduled_date date not null,entry_id uuid,status text not null check(status in ('posted','skipped')),
 foreign key(schedule_id,user_id) references public.recurring_schedules(id,user_id),unique(schedule_id,scheduled_date)
);
-- Relationships preserve owner identity; only the authenticated owner's rows are visible.
alter table public.accounts enable row level security;
alter table public.account_transfers enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.recurring_occurrences enable row level security;
create policy own_accounts on public.accounts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_transfers on public.account_transfers for select to authenticated using(user_id=auth.uid());
create policy own_schedules on public.recurring_schedules for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own_occurrences on public.recurring_occurrences for select to authenticated using(user_id=auth.uid());
revoke all on public.accounts,public.account_transfers,public.recurring_schedules,public.recurring_occurrences from public,anon,authenticated;
grant select,insert,update on public.accounts,public.recurring_schedules to authenticated;
grant select on public.account_transfers,public.recurring_occurrences to authenticated;

create function public.validate_account_links() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare a public.accounts;c text;begin
 if tg_table_name='entries' then
  if new.account_id is not null then
   select * into a from accounts where id=new.account_id and user_id=new.user_id;
   if not found or a.currency<>new.currency or new.date<a.opening_date then raise exception 'Account currency and opening date must match this record';end if;
   if a.archived and (tg_op='INSERT' or old.account_id is distinct from new.account_id) then raise exception 'Choose an active account';end if;
  end if;
 else
  if tg_op='UPDATE' and (old.start_date<>new.start_date or old.frequency<>new.frequency or old.kind<>new.kind or old.currency<>new.currency) then raise exception 'Keep the schedule type, currency and anchor; stop this schedule and create a new one to change them';end if;
  if new.archived and tg_op='UPDATE' then return new;end if;
  select kind into c from categories where id=new.category_id and user_id=new.user_id and not archived;
  if c is distinct from new.kind then raise exception 'Choose an active category matching the schedule type';end if;
  if new.account_id is not null then
   select * into a from accounts where id=new.account_id and user_id=new.user_id;
   if not found or a.currency<>new.currency or a.archived or new.start_date<a.opening_date then raise exception 'Choose an active account matching this schedule';end if;
  end if;
  if tg_op='UPDATE' and (old.start_date<>new.start_date or old.frequency<>new.frequency) then raise exception 'Keep the schedule anchor; stop this schedule and create a new one to change frequency';end if;
 end if;return new;
end $$;
create trigger validate_account_entry before insert or update on public.entries for each row execute function public.validate_account_links();
create trigger validate_schedule before insert or update on public.recurring_schedules for each row execute function public.validate_account_links();
create function public.protect_account_history() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if exists(select 1 from removed_entries where entry->>'account_id'=new.id::text and (entry->>'currency'<>new.currency or (entry->>'date')::date<new.opening_date)) or exists(select 1 from recurring_schedules where account_id=new.id and (currency<>new.currency or start_date<new.opening_date)) or exists(select 1 from entries where account_id=new.id and (currency<>new.currency or date<new.opening_date)) or exists(select 1 from account_transfers where (from_account_id=new.id or to_account_id=new.id) and (currency<>new.currency or date<new.opening_date)) then raise exception 'Currency and opening date must preserve all existing account activity';end if;
 return new;
end $$;
create trigger protect_account_history before update on public.accounts for each row execute function public.protect_account_history();

-- An allocation linked to a transfer is counted in goals once, but never debited twice.
create function public.check_transfer_pair() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid;tid uuid;t public.account_transfers;e public.entries; k text;begin
 owner_id=coalesce(new.user_id,old.user_id);
 if not exists(select 1 from auth.users where id=owner_id) then return null;end if;
 if tg_table_name='entries' then tid=coalesce(new.funding_transfer_id,old.funding_transfer_id);else tid=coalesce(new.id,old.id);end if;
 if tid is null then return null;end if;
 select * into t from account_transfers where id=tid and user_id=owner_id;
 if not found or t.removed_at is not null then
  if exists(select 1 from entries where funding_transfer_id=tid) then raise exception 'Restore the transfer with its linked allocation';end if;return null;
 end if;
 if t.allocation_entry_id is not null then
  select * into e from entries where id=t.allocation_entry_id and user_id=owner_id;
  select kind into k from categories where id=e.category_id and user_id=owner_id;
  if e.id is null or e.funding_transfer_id is distinct from t.id or e.account_id is not null or e.currency<>t.currency or e.amount_minor<>t.amount_minor or e.date<>t.date or k not in ('saving','investment') or e.named_goal_id is null then raise exception 'Edit or remove this transfer and allocation together in Accounts';end if;
 end if;
 if exists(select 1 from entries where funding_transfer_id=t.id and id is distinct from t.allocation_entry_id) then raise exception 'A transfer may fund one allocation only';end if;
 return null;
end $$;
create constraint trigger transfer_pair after insert or update or delete on public.account_transfers deferrable initially deferred for each row execute function public.check_transfer_pair();
create constraint trigger entry_transfer_pair after insert or update or delete on public.entries deferrable initially deferred for each row execute function public.check_transfer_pair();
create function public.save_account_transfer(p_transfer jsonb,p_allocation jsonb default null,p_edit boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid();t public.account_transfers;previous public.account_transfers;a public.accounts;b public.accounts;e public.entries;begin
 if owner_id is null then raise exception 'Sign in to save a transfer';end if;
 perform 1 from profiles where user_id=owner_id for update;
 select * into t from jsonb_populate_record(null::public.account_transfers,p_transfer);t.user_id=owner_id;t.removed_at=null;
 if exists(select 1 from account_transfers where id=t.id and user_id<>owner_id) then raise exception 'Transfer ID is not available';end if;
 select * into previous from account_transfers where id=t.id and user_id=owner_id for update;
 if previous.removed_at is not null then raise exception 'Restore the removed transfer before editing';end if;
 if previous.id is not null and not p_edit then
  if (to_jsonb(previous)-'removed_at')=(to_jsonb(t)-'removed_at') then
   if p_allocation is not null then
    select * into e from jsonb_populate_record(null::public.entries,p_allocation);e.user_id=owner_id;e.notes=coalesce(e.notes,'');e.withdrawal=coalesce(e.withdrawal,false);e.funding_transfer_id=t.id;e.account_id=null;
    if not exists(select 1 from entries where id=t.allocation_entry_id and user_id=owner_id and (to_jsonb(entries)-'created_at')=(to_jsonb(e)-'created_at')) then raise exception 'The allocation is already saved with different values. Refresh before retrying';end if;
   end if;
   return;
  end if;raise exception 'This transfer already exists with different values. Refresh before retrying';
 end if;
 if p_edit and previous.id is null then raise exception 'Transfer no longer exists';end if;
 select * into a from accounts where id=t.from_account_id and user_id=owner_id;
 select * into b from accounts where id=t.to_account_id and user_id=owner_id;
 if a.id is null or b.id is null or a.id=b.id or a.currency<>b.currency or a.currency<>t.currency or t.date<a.opening_date or t.date<b.opening_date then raise exception 'Choose different owned accounts in the same currency, with a compatible date';end if;
 if a.archived and previous.from_account_id is distinct from a.id or b.archived and previous.to_account_id is distinct from b.id then raise exception 'Choose active accounts for a new transfer or account assignment';end if;
 if previous.allocation_entry_id is not null and t.allocation_entry_id is distinct from previous.allocation_entry_id then raise exception 'Preserve the linked allocation when editing a transfer';end if;
 insert into account_transfers select t.* on conflict(id) do update set from_account_id=excluded.from_account_id,to_account_id=excluded.to_account_id,currency=excluded.currency,amount_minor=excluded.amount_minor,date=excluded.date,notes=excluded.notes;
 if p_allocation is not null then
  select * into e from jsonb_populate_record(null::public.entries,p_allocation);e.user_id=owner_id;e.created_at=now();e.notes=coalesce(e.notes,'');e.withdrawal=coalesce(e.withdrawal,false);e.funding_transfer_id=t.id;e.account_id=null;
  if exists(select 1 from entries where id=e.id and user_id<>owner_id) then raise exception 'Allocation ID is not available';end if;
  if e.id is distinct from t.allocation_entry_id or e.named_goal_id is null then raise exception 'Choose a matching goal allocation';end if;
  insert into entries select e.* on conflict(id) do update set amount_minor=excluded.amount_minor,date=excluded.date,notes=excluded.notes;
 elsif t.allocation_entry_id is not null then
  update entries set amount_minor=t.amount_minor,date=t.date,notes=t.notes where id=t.allocation_entry_id and user_id=owner_id;
 end if;
end $$;
create function public.set_transfer_removed(p_id uuid,p_removed boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid();t public.account_transfers;begin
 if owner_id is null then raise exception 'Sign in to change a transfer';end if;
 perform 1 from profiles where user_id=owner_id for update;
 select * into t from account_transfers where id=p_id and user_id=owner_id for update;
 if not found then raise exception 'Transfer not found';end if;
 if p_removed=(t.removed_at is not null) then return;end if;
 update account_transfers set removed_at=case when p_removed then now() else null end where id=p_id and user_id=owner_id;
 if t.allocation_entry_id is not null then
  if p_removed then perform remove_recorded_entry(t.allocation_entry_id);else perform restore_recorded_entry(t.allocation_entry_id);end if;
 end if;
end $$;
create function public.record_recurring_occurrence(p_schedule uuid,p_date date,p_entry jsonb default null) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid();s public.recurring_schedules;o public.recurring_occurrences;e public.entries;anchor date;months integer;begin
 if owner_id is null then raise exception 'Sign in to confirm an occurrence';end if;
 perform 1 from profiles where user_id=owner_id for update;
 select * into s from recurring_schedules where id=p_schedule and user_id=owner_id for update;
 if not found or s.archived or p_date<s.start_date or s.end_date is not null and p_date>s.end_date then raise exception 'Choose an active scheduled occurrence';end if;
 months=(extract(year from p_date)::int-extract(year from s.start_date)::int)*12+extract(month from p_date)::int-extract(month from s.start_date)::int;
 if s.frequency='weekly' then
  if (p_date-s.start_date)%7<>0 then raise exception 'Not a scheduled date';end if;
 else
  anchor=(date_trunc('month',p_date)+least(extract(day from s.start_date)::int,extract(day from (date_trunc('month',p_date)+interval '1 month - 1 day'))::int)*interval '1 day'-interval '1 day')::date;
  if p_date<>anchor or s.frequency='yearly' and months%12<>0 then raise exception 'Not a scheduled date';end if;
 end if;
 if p_entry is not null then
  select * into e from jsonb_populate_record(null::public.entries,p_entry);e.user_id=owner_id;e.created_at=now();e.notes=coalesce(e.notes,'');e.withdrawal=coalesce(e.withdrawal,false);
 end if;
 select * into o from recurring_occurrences where schedule_id=s.id and scheduled_date=p_date and user_id=owner_id;
 if found then
  if p_entry is null and o.status='skipped' then return null;end if;
  if o.status='posted' and o.entry_id=(p_entry->>'id')::uuid then
   if exists(select 1 from entries where id=o.entry_id and user_id=owner_id and (to_jsonb(entries)-'created_at')=(to_jsonb(e)-'created_at')) then return o.entry_id;end if;
   raise exception 'This occurrence was recorded. Refresh or restore it from Removed entries';
  end if;raise exception 'This occurrence is already confirmed. Refresh before recording';
 end if;
 if p_entry is null then insert into recurring_occurrences(user_id,schedule_id,scheduled_date,status) values(owner_id,s.id,p_date,'skipped');return null;end if;
 select * into e from jsonb_populate_record(null::public.entries,p_entry);e.user_id=owner_id;e.created_at=now();e.notes=coalesce(e.notes,'');e.withdrawal=coalesce(e.withdrawal,false);
 if e.currency<>s.currency or e.withdrawal or e.funding_transfer_id is not null or not exists(select 1 from categories where id=e.category_id and user_id=owner_id and kind=s.kind) then raise exception 'Keep the occurrence type and currency';end if;
 insert into entries select e.*;
 insert into recurring_occurrences(user_id,schedule_id,scheduled_date,entry_id,status) values(owner_id,s.id,p_date,e.id,'posted');return e.id;
end $$;
create function public.workspace_features() returns jsonb language sql stable as $$select '{"accounts":true,"recurring":true}'::jsonb$$;
revoke all on function public.save_account_transfer(jsonb,jsonb,boolean),public.set_transfer_removed(uuid,boolean),public.record_recurring_occurrence(uuid,date,jsonb),public.workspace_features() from public,anon;
grant execute on function public.save_account_transfer(jsonb,jsonb,boolean),public.set_transfer_removed(uuid,boolean),public.record_recurring_occurrence(uuid,date,jsonb),public.workspace_features() to authenticated;
commit;
