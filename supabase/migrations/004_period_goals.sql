-- Adds independent monthly/yearly goals without changing existing plans or records.
begin;
create table public.period_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period ~ '^(19[0-9]{2}|20[0-9]{2}|2100)(-(0[1-9]|1[0-2]))?$'),
  currency text not null check (currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
  kind text not null check (kind in ('expense','saving','investment','income')),
  category_id uuid,
  target_minor bigint not null check (target_minor between 0 and 1000000000000),
  foreign key (category_id, user_id) references public.categories(id,user_id),
  check (category_id is null or kind = 'expense')
);
create unique index period_goal_scope on public.period_goals(user_id, period, currency, kind, coalesce(category_id,'00000000-0000-0000-0000-000000000000'::uuid));
alter table public.period_goals enable row level security;
create policy period_goal_owner on public.period_goals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.period_goals from anon, authenticated;
grant select, insert, update, delete on public.period_goals to authenticated;
create function public.validate_period_goal() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.category_id is not null and not exists (select 1 from public.categories where id=new.category_id and user_id=new.user_id and kind='expense') then
    raise exception 'Expense category is not available to this user';
  end if;
  if tg_op='UPDATE' and (new.id<>old.id or new.user_id<>old.user_id) then raise exception 'Goal ownership cannot be changed'; end if;
  return new;
end; $$;
create trigger goal_consistency before insert or update on public.period_goals for each row execute function public.validate_period_goal();
-- Transactional replacement: an invalid goal rolls back the entire edit.
create function public.replace_period_goals(p_period text, p_currency text, p_goals jsonb) returns void language plpgsql set search_path = public, pg_temp as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Sign in to save goals'; end if;
  if p_period !~ '^(19[0-9]{2}|20[0-9]{2}|2100)(-(0[1-9]|1[0-2]))?$' or p_period is null then raise exception 'Invalid goal period'; end if;
  if p_currency is null or p_currency not in ('USD','PKR','EUR','GBP','AED','JPY','KWD') then raise exception 'Invalid currency'; end if;
  if p_goals is null or jsonb_typeof(p_goals)<>'array' then raise exception 'Invalid goals'; end if;
  if jsonb_array_length(p_goals)>1000 then raise exception 'Too many goals'; end if;
  -- Serialize simultaneous edits of the same user's plans.
  perform 1 from public.profiles where user_id=owner_id for update;
  delete from public.period_goals where user_id=owner_id and period=p_period and currency=p_currency;
  insert into public.period_goals(user_id,period,currency,kind,category_id,target_minor)
  select owner_id,p_period,p_currency,g.kind,g.category_id,g.target_minor
  from jsonb_to_recordset(p_goals) as g(kind text, category_id uuid, target_minor bigint);
end; $$;
revoke all on function public.replace_period_goals(text,text,jsonb) from public, anon;
grant execute on function public.replace_period_goals(text,text,jsonb) to authenticated;
revoke all on function public.validate_period_goal() from public, anon, authenticated;
commit;
