-- Optional parent-category savings/investment targets. Existing records and RLS stay intact.
begin;
alter table public.period_goals drop constraint period_goals_check;
alter table public.period_goals add constraint period_goals_category_kind check (category_id is null or kind in ('expense','saving','investment'));
create or replace function public.validate_period_goal() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.category_id is not null and not exists (select 1 from public.categories where id=new.category_id and user_id=new.user_id and kind=new.kind and kind in ('expense','saving','investment')) then
    raise exception 'Category and goal type must match in your own account';
  end if;
  if tg_op='UPDATE' and (new.id<>old.id or new.user_id<>old.user_id) then raise exception 'Goal ownership cannot be changed'; end if;
  return new;
end; $$;
-- CREATE OR REPLACE preserves the existing function's revoked public execution privileges.
commit;
