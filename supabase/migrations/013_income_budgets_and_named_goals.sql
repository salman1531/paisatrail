-- Additive planning model. Recorded transactions and historical period_goals remain intact.
begin;
create table public.income_sources (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 60 and name=trim(name)), category_id uuid not null,
 pattern text not null check(pattern in ('regular','variable')), currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
 archived boolean not null default false, unique(id,user_id), foreign key(category_id,user_id) references public.categories(id,user_id)
);
create table public.expected_payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 source_id uuid, category_id uuid not null, name text not null check(length(trim(name)) between 1 and 100 and name=trim(name)),
 currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')), amount_minor bigint not null check(amount_minor between 1 and 1000000000000),
 period_start date not null, period_end date not null, cancelled boolean not null default false, unique(id,user_id),
 check(period_start between '1900-01-01' and '2100-12-31' and period_end between period_start and '2100-12-31'),
 foreign key(source_id,user_id) references public.income_sources(id,user_id), foreign key(category_id,user_id) references public.categories(id,user_id)
);
create table public.spending_budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 period_start date not null, period_end date not null, currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
 total_minor bigint check(total_minor between 0 and 1000000000000), rollover boolean not null default false,
 unique(id,user_id), unique(user_id,period_start,period_end,currency),
 check(period_start between '1900-01-01' and '2100-12-31' and period_end between period_start and '2100-12-31')
);
create table public.budget_allocations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 budget_id uuid not null, category_id uuid not null, subcategory_id uuid, amount_minor bigint not null check(amount_minor between 0 and 1000000000000),
 foreign key(budget_id,user_id) references public.spending_budgets(id,user_id) on delete cascade,
 foreign key(category_id,user_id) references public.categories(id,user_id), foreign key(subcategory_id,user_id,category_id) references public.subcategories(id,user_id,category_id)
);
create unique index budget_allocation_scope on public.budget_allocations(budget_id,category_id,coalesce(subcategory_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table public.named_goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 60 and name=trim(name)),
 currency text not null check(currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
 target_minor bigint not null check(target_minor between 1 and 1000000000000), starting_minor bigint not null default 0 check(starting_minor between 0 and 1000000000000),
 deadline date check(deadline between '1900-01-01' and '2100-12-31'), funding_kind text not null default 'saving' check(funding_kind in ('saving','investment')),
 status text not null default 'active' check(status in ('active','paused','complete')), unique(id,user_id)
);
create table public.goal_contribution_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, goal_id uuid not null,
 period_start date not null, period_end date not null, amount_minor bigint not null check(amount_minor between 0 and 1000000000000),
 foreign key(goal_id,user_id) references public.named_goals(id,user_id), unique(user_id,goal_id,period_start,period_end),
 check(period_start between '1900-01-01' and '2100-12-31' and period_end between period_start and '2100-12-31')
);
create table public.budget_cycles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 effective_from date not null check(effective_from between '1900-01-01' and '2100-12-31'), start_day integer not null check(start_day between 1 and 31), unique(user_id,effective_from)
);
-- Every relationship is owner-qualified; no new admin access to financial records.
alter table public.entries add column income_source_id uuid, add column expected_payment_id uuid, add column named_goal_id uuid,
 add foreign key(income_source_id,user_id) references public.income_sources(id,user_id),
 add foreign key(expected_payment_id,user_id) references public.expected_payments(id,user_id),
 add foreign key(named_goal_id,user_id) references public.named_goals(id,user_id);
create index entries_expected_receipts on public.entries(user_id,expected_payment_id) where expected_payment_id is not null;
create index entries_named_goal on public.entries(user_id,named_goal_id) where named_goal_id is not null;
do $$ declare t text; begin foreach t in array array['income_sources','expected_payments','spending_budgets','budget_allocations','named_goals','goal_contribution_plans','budget_cycles'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy planning_owner on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,update on public.%I to authenticated',t);
 end loop; end $$;
-- Allocation replacement is private and transactional; avoid parent/child double allocations.
create function public.replace_spending_budget(p_budget jsonb,p_items jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); saved_id uuid; b public.spending_budgets; begin
 if owner_id is null then raise exception 'Sign in to save a budget'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>1000 then raise exception 'Invalid budget allocations'; end if;
 perform 1 from public.profiles where user_id=owner_id for update;
 select * into b from jsonb_populate_record(null::public.spending_budgets,p_budget);
 insert into public.spending_budgets(id,user_id,period_start,period_end,currency,total_minor,rollover) values(b.id,owner_id,b.period_start,b.period_end,b.currency,b.total_minor,b.rollover)
 on conflict(user_id,period_start,period_end,currency) do update set total_minor=excluded.total_minor,rollover=excluded.rollover returning id into saved_id;
 delete from public.budget_allocations where budget_id=saved_id and user_id=owner_id;
 insert into public.budget_allocations(user_id,budget_id,category_id,subcategory_id,amount_minor)
 select owner_id,saved_id,x.category_id,x.subcategory_id,x.amount_minor from jsonb_to_recordset(p_items) as x(category_id uuid,subcategory_id uuid,amount_minor bigint);
 end $$;
-- Owner-scoped DELETE supports the INVOKER replacement RPC; RLS also protects direct writes.
grant delete on public.budget_allocations to authenticated;
create function public.save_named_goal(p_goal jsonb,p_start date,p_end date,p_amount bigint) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); g public.named_goals; begin
 if owner_id is null then raise exception 'Sign in to save a goal'; end if;
 perform 1 from public.profiles where user_id=owner_id for update;
 select * into g from jsonb_populate_record(null::public.named_goals,p_goal);
 insert into public.named_goals(id,user_id,name,currency,target_minor,starting_minor,deadline,funding_kind,status)
 values(g.id,owner_id,g.name,g.currency,g.target_minor,g.starting_minor,g.deadline,g.funding_kind,g.status)
 on conflict(id) do update set name=excluded.name,currency=excluded.currency,target_minor=excluded.target_minor,starting_minor=excluded.starting_minor,deadline=excluded.deadline,funding_kind=excluded.funding_kind,status=excluded.status;
 if p_start is null or p_end is null or p_end<p_start then raise exception 'Choose valid contribution dates'; end if;
 if p_amount is null then delete from public.goal_contribution_plans where goal_id=g.id and user_id=owner_id and period_start=p_start and period_end=p_end;
 else insert into public.goal_contribution_plans(user_id,goal_id,period_start,period_end,amount_minor) values(owner_id,g.id,p_start,p_end,p_amount)
 on conflict(user_id,goal_id,period_start,period_end) do update set amount_minor=excluded.amount_minor; end if;
 end $$;
grant delete on public.goal_contribution_plans to authenticated;
revoke all on function public.save_named_goal(jsonb,date,date,bigint) from public,anon;
grant execute on function public.save_named_goal(jsonb,date,date,bigint) to authenticated;
-- A scheduled change must start at a future boundary of the user's current cycle.
create function public.cycle_boundary(p_month date,p_day integer) returns date language sql immutable set search_path=public,pg_temp as $$
 select date_trunc('month',p_month)::date+least(p_day,extract(day from date_trunc('month',p_month)+interval '1 month - 1 day')::integer)-1 $$;
revoke all on function public.cycle_boundary(date,integer) from public,anon;
grant execute on function public.cycle_boundary(date,integer) to authenticated;
create function public.validate_planning_record() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare s public.income_sources; g public.named_goals; progress bigint; old_day integer; begin
 if tg_op='UPDATE' and (new.id<>old.id or new.user_id<>old.user_id) then raise exception 'Planning ownership cannot change'; end if;
 if tg_table_name='income_sources' then
  if not exists(select 1 from categories where id=new.category_id and user_id=new.user_id and kind='income') then raise exception 'Choose an owned income category'; end if;
  if tg_op='UPDATE' and new.category_id<>old.category_id and (exists(select 1 from entries where income_source_id=old.id) or exists(select 1 from expected_payments where source_id=old.id)) then raise exception 'A linked source must retain its category'; end if;
 elsif tg_table_name='expected_payments' then
  if not exists(select 1 from categories where id=new.category_id and user_id=new.user_id and kind='income') then raise exception 'Choose an owned income category'; end if;
  if new.source_id is not null then select * into s from income_sources where id=new.source_id and user_id=new.user_id; if not found or s.category_id<>new.category_id then raise exception 'Source and category must match'; end if; end if;
  if tg_op='UPDATE' then
   if (new.currency<>old.currency or new.category_id<>old.category_id or new.source_id is distinct from old.source_id or new.period_start<>old.period_start or new.period_end<>old.period_end) and exists(select 1 from entries where expected_payment_id=old.id) then raise exception 'Received payments retain their currency, source and period'; end if;
   if new.amount_minor<>old.amount_minor and new.amount_minor<(select coalesce(sum(amount_minor),0) from entries where expected_payment_id=old.id) then raise exception 'Expected amount cannot be below receipts; cancel the remainder instead'; end if;
  end if;
 elsif tg_table_name='spending_budgets' then
  if tg_op='UPDATE' and (new.period_start<>old.period_start or new.period_end<>old.period_end or new.currency<>old.currency) then raise exception 'Saved budget dates and currency stay fixed'; end if;
 elsif tg_table_name='budget_allocations' then
  -- Serializes direct API writes as well as the replacement RPC.
  perform 1 from spending_budgets where id=new.budget_id and user_id=new.user_id for update;
  if not found or not exists(select 1 from categories where id=new.category_id and user_id=new.user_id and kind='expense') then raise exception 'Choose an owned budget and expense category'; end if;
  if new.subcategory_id is not null and not exists(select 1 from subcategories where id=new.subcategory_id and user_id=new.user_id and category_id=new.category_id) then raise exception 'Choose a child of this category'; end if;
  if exists(select 1 from budget_allocations where budget_id=new.budget_id and id<>new.id and category_id=new.category_id and (subcategory_id is null or new.subcategory_id is null)) then raise exception 'Budget a parent or its children, never both'; end if;
 elsif tg_table_name='named_goals' then
  if tg_op='UPDATE' then
   if (new.currency<>old.currency or new.funding_kind<>old.funding_kind) then raise exception 'Goals retain currency and contribution type'; end if;
   select new.starting_minor+coalesce(sum(case when withdrawal then -amount_minor else amount_minor end),0) into progress from entries where named_goal_id=old.id;
   if progress<0 then raise exception 'Starting savings cannot make goal progress negative'; end if;
  end if;
 elsif tg_table_name='goal_contribution_plans' then
  if not exists(select 1 from named_goals where id=new.goal_id and user_id=new.user_id) then raise exception 'Choose an owned goal'; end if;
 elsif tg_table_name='budget_cycles' then
  if tg_op='UPDATE' then raise exception 'Keep earlier cycle records; schedule a new change'; end if;
  perform 1 from profiles where user_id=new.user_id for update;
  select start_day into old_day from budget_cycles where user_id=new.user_id and effective_from<new.effective_from order by effective_from desc limit 1;
  if new.effective_from<>public.cycle_boundary(new.effective_from,coalesce(old_day,1)) then raise exception 'Schedule at a boundary of your existing cycle'; end if;
  if new.effective_from<=(now() at time zone (select timezone from profiles where user_id=new.user_id))::date then raise exception 'Choose a future cycle boundary'; end if;
  if exists(select 1 from budget_cycles where user_id=new.user_id and effective_from>new.effective_from) then raise exception 'Schedule after existing cycle changes'; end if;
 end if;
 return new; end $$;
do $$ declare t text; begin foreach t in array array['income_sources','expected_payments','spending_budgets','budget_allocations','named_goals','goal_contribution_plans','budget_cycles'] loop
 execute format('create trigger planning_record_check before insert or update on public.%I for each row execute function public.validate_planning_record()',t);
 end loop; end $$;
create function public.validate_planning_entry() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare c text; p public.expected_payments; s public.income_sources; goal_id uuid; g public.named_goals; progress bigint; begin
 -- Auth-parent deletion is already protected by the admin RPC. Skip progress checks
 -- while cascading that account; ordinary deletes still enforce nonnegative goals.
 if tg_op='DELETE' and not exists(select 1 from auth.users where id=old.user_id) then return old; end if;
 if tg_op<>'DELETE' then
  select kind into c from categories where id=new.category_id and user_id=new.user_id;
  if new.income_source_id is not null then select * into s from income_sources where id=new.income_source_id and user_id=new.user_id; if not found or c<>'income' or s.category_id<>new.category_id then raise exception 'Income source must match category and owner'; end if; end if;
  if new.expected_payment_id is not null then
   select * into p from expected_payments where id=new.expected_payment_id and user_id=new.user_id for update;
   if not found or c<>'income' or new.currency<>p.currency or new.category_id<>p.category_id or new.income_source_id is distinct from p.source_id then raise exception 'Receipt must match expected payment'; end if;
   if p.cancelled and (tg_op='INSERT' or new.expected_payment_id is distinct from old.expected_payment_id) then raise exception 'Expected payment has been cancelled'; end if;
  end if;
 end if;
 -- Lock both affected goals in a stable order, so edits/deletes cannot create negative progress.
 for goal_id in select distinct id from (select case when tg_op<>'INSERT' then old.named_goal_id end as id union all select case when tg_op<>'DELETE' then new.named_goal_id end as id) x where id is not null order by id loop
  select * into g from named_goals where id=goal_id and user_id=case when tg_op='DELETE' then old.user_id else new.user_id end for update;
  if not found then raise exception 'Goal belongs to another account'; end if;
  if tg_op<>'DELETE' and new.named_goal_id=goal_id and (c<>g.funding_kind or new.currency<>g.currency) then raise exception 'Goal currency and contribution type must match'; end if;
  select g.starting_minor+coalesce(sum(case when withdrawal then -amount_minor else amount_minor end),0) into progress from entries where named_goal_id=goal_id and id<>case when tg_op='DELETE' then old.id else new.id end;
  if tg_op<>'DELETE' and new.named_goal_id=goal_id then progress:=progress+case when new.withdrawal then -new.amount_minor else new.amount_minor end; end if;
  if progress<0 then raise exception 'Withdrawal or correction exceeds goal progress'; end if;
 end loop;
 if tg_op='DELETE' then return old; else return new; end if;
 end $$;
create trigger entry_planning_check before insert or update or delete on public.entries for each row execute function public.validate_planning_entry();
revoke all on function public.validate_planning_record(),public.validate_planning_entry(),public.replace_spending_budget(jsonb,jsonb) from public,anon;
revoke execute on function public.validate_planning_record(),public.validate_planning_entry() from authenticated;
grant execute on function public.replace_spending_budget(jsonb,jsonb) to authenticated;
create function public.save_income_source(p_source jsonb,p_payment jsonb default null) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); s public.income_sources; p public.expected_payments; begin
 if owner_id is null then raise exception 'Sign in to save an income source'; end if;
 perform 1 from profiles where user_id=owner_id for update;
 select * into s from jsonb_populate_record(null::public.income_sources,p_source);
 insert into income_sources(id,user_id,name,category_id,pattern,currency,archived) values(s.id,owner_id,s.name,s.category_id,s.pattern,s.currency,s.archived)
 on conflict(id) do update set name=excluded.name,category_id=excluded.category_id,pattern=excluded.pattern,currency=excluded.currency,archived=excluded.archived;
 if p_payment is not null then
 select * into p from jsonb_populate_record(null::public.expected_payments,p_payment);
 insert into expected_payments(id,user_id,source_id,category_id,name,currency,amount_minor,period_start,period_end,cancelled)
 values(p.id,owner_id,s.id,s.category_id,p.name,p.currency,p.amount_minor,p.period_start,p.period_end,false)
 on conflict(id) do update set name=excluded.name,amount_minor=excluded.amount_minor;
 end if; end $$;
revoke all on function public.save_income_source(jsonb,jsonb) from public,anon;
grant execute on function public.save_income_source(jsonb,jsonb) to authenticated;
-- Move saved calendar expense plans, preserving explicit zero/unset and every legacy row.
insert into public.spending_budgets(user_id,period_start,period_end,currency,total_minor)
 select user_id,(period||'-01')::date,((period||'-01')::date+interval '1 month'-interval '1 day')::date,currency,max(target_minor) filter(where category_id is null)
 from public.period_goals where kind='expense' and length(period)=7 group by user_id,period,currency;
insert into public.budget_allocations(user_id,budget_id,category_id,amount_minor)
 select g.user_id,b.id,g.category_id,g.target_minor from public.period_goals g join public.spending_budgets b on b.user_id=g.user_id and b.period_start=(case when length(g.period)=7 then g.period||'-01' end)::date and b.currency=g.currency
 where g.kind='expense' and length(g.period)=7 and g.category_id is not null and g.target_minor is not null;
commit;
