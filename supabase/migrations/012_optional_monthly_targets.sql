-- Explicit unset overall goals block legacy defaults without becoming zero.
-- Existing numeric goals, policies, privileges and relationship checks are unchanged.
begin;
alter table public.period_goals alter column target_minor drop not null;
alter table public.period_goals add constraint period_goals_unset_overall_only
  check (target_minor is not null or category_id is null);
commit;
