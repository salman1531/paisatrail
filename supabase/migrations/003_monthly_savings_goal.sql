begin;
alter table public.profiles add column saving_target bigint not null default 0 check (saving_target between 0 and 1000000000000);
-- Preserve the existing plan: emergency contributions become a subset of total savings.
update public.profiles set saving_target = emergency_contribution;
alter table public.profiles add constraint emergency_within_savings check (emergency_contribution <= saving_target);
create or replace function public.validate_profile() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then raise exception 'Invalid timezone'; end if;
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then raise exception 'Profile ownership cannot be changed'; end if;
  if tg_op = 'UPDATE' and new.currency <> old.currency and (new.income_target <> 0 or new.spending_target <> 0 or new.saving_target <> 0 or new.investment_target <> 0 or new.emergency_target <> 0 or new.emergency_contribution <> 0) then
    raise exception 'Reset planning targets when changing currency';
  end if;
  return new;
end; $$;
commit;
