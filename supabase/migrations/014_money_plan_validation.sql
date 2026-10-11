-- Money Plan reuses existing private records and grants. No history is rewritten.
begin;
alter table public.goal_contribution_plans add column if not exists legacy_goal_id uuid;
create unique index if not exists contribution_legacy_once on public.goal_contribution_plans(legacy_goal_id) where legacy_goal_id is not null;
create or replace function public.validate_legacy_goal_plan() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and old.legacy_goal_id is not null and new.legacy_goal_id is distinct from old.legacy_goal_id then raise exception 'Keep the earlier plan association; clear the period plan to remove it'; end if;
 if new.legacy_goal_id is not null and not exists(
  select 1 from public.period_goals p join public.named_goals g on g.id=new.goal_id and g.user_id=new.user_id
  where p.id=new.legacy_goal_id and p.user_id=new.user_id and p.category_id is null and p.kind=g.funding_kind and p.currency=g.currency and p.period=to_char(new.period_start,'YYYY-MM') and p.target_minor is not null
 ) then raise exception 'Choose an owned earlier savings plan matching this goal, currency and period'; end if;
 return new;
end $$;
-- Check the final replacement, rather than rejecting a valid multi-row draft halfway through.
create or replace function public.validate_spending_total() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare checked_budget uuid; previous_id uuid; owner_id uuid; base bigint; allocated numeric;
begin
 owner_id:=case when tg_op='DELETE' then old.user_id else new.user_id end;
 -- Protected account deletion cascades are allowed after the parent account is removed.
 perform 1 from public.profiles where user_id=owner_id for update;
 if not found then return null; end if;
 if tg_table_name='spending_budgets' then checked_budget:=new.id;
 else checked_budget:=case when tg_op='DELETE' then old.budget_id else new.budget_id end;
  if tg_op='UPDATE' then previous_id:=old.budget_id; end if;
 end if;
 for checked_budget in select distinct x from unnest(array[checked_budget,previous_id]) x where x is not null loop
  select total_minor into base from public.spending_budgets where id=checked_budget and user_id=owner_id;
  if base is not null then
   select coalesce(sum(amount_minor),0) into allocated from public.budget_allocations where budget_allocations.budget_id=checked_budget and user_id=owner_id;
   if allocated>base then raise exception 'Category limits exceed the overall spending limit by % minor units. Raise the overall limit or reduce category limits.',allocated-base; end if;
  end if;
 end loop;
 return null;
end $$;
do $$ begin
 if not exists(select 1 from pg_trigger where tgname='money_plan_budget_total' and tgrelid='public.spending_budgets'::regclass) then
  create constraint trigger money_plan_budget_total after insert or update on public.spending_budgets deferrable initially deferred for each row execute function public.validate_spending_total();
 end if;
 if not exists(select 1 from pg_trigger where tgname='money_plan_allocation_total' and tgrelid='public.budget_allocations'::regclass) then
  create constraint trigger money_plan_allocation_total after insert or update or delete on public.budget_allocations deferrable initially deferred for each row execute function public.validate_spending_total();
 end if;
 if not exists(select 1 from pg_trigger where tgname='money_plan_legacy_goal' and tgrelid='public.goal_contribution_plans'::regclass) then
  create trigger money_plan_legacy_goal before insert or update on public.goal_contribution_plans for each row execute function public.validate_legacy_goal_plan();
 end if;
end $$;
create or replace function public.save_named_goal(p_goal jsonb,p_start date,p_end date,p_amount bigint) returns void language plpgsql set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); g public.named_goals; legacy_id uuid;
begin
 if owner_id is null then raise exception 'Sign in to save a goal'; end if;
 perform 1 from public.profiles where user_id=owner_id for update;
 select * into g from jsonb_populate_record(null::public.named_goals,p_goal);
 legacy_id:=nullif(p_goal->>'legacy_goal_id','')::uuid;
 insert into public.named_goals(id,user_id,name,currency,target_minor,starting_minor,deadline,funding_kind,status)
 values(g.id,owner_id,g.name,g.currency,g.target_minor,g.starting_minor,g.deadline,g.funding_kind,g.status)
 on conflict(id) do update set name=excluded.name,currency=excluded.currency,target_minor=excluded.target_minor,starting_minor=excluded.starting_minor,deadline=excluded.deadline,funding_kind=excluded.funding_kind,status=excluded.status;
 if p_start is null or p_end is null or p_end<p_start then raise exception 'Choose valid contribution dates'; end if;
 if p_amount is null then delete from public.goal_contribution_plans where goal_id=g.id and user_id=owner_id and period_start=p_start and period_end=p_end;
 else insert into public.goal_contribution_plans(user_id,goal_id,period_start,period_end,amount_minor,legacy_goal_id) values(owner_id,g.id,p_start,p_end,p_amount,legacy_id)
 on conflict(user_id,goal_id,period_start,period_end) do update set amount_minor=excluded.amount_minor,legacy_goal_id=coalesce(excluded.legacy_goal_id,goal_contribution_plans.legacy_goal_id); end if;
end $$;
-- Existing RPC privileges survive CREATE OR REPLACE. Internal trigger functions are not APIs.
revoke all on function public.validate_spending_total(),public.validate_legacy_goal_plan() from public,anon,authenticated;
commit;
