-- Read-only extension of the existing member-authorized report. No ledger,
-- allocation, repayment, grant, or membership rule changes. 018 clients remain compatible.
begin;
create or replace function public.shared_report(p_context uuid default null,p_start date default '1900-01-01',p_end date default '2100-12-31') returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or p_context is not null and not shared_member(p_context) then raise exception 'Shared space unavailable';end if;
 if p_start is null or p_end is null or p_start>p_end or p_start<'1900-01-01' or p_end>'2100-12-31' then raise exception 'Choose a valid date range';end if;
 with included as materialized (
  select e.* from shared_expenses e where shared_member(e.context_id) and (p_context is null or e.context_id=p_context) and not e.cancelled and e.date between p_start and p_end
 ), people as materialized (
  select p.id,p.context_id,p.name,p.user_id from shared_participants p where shared_member(p.context_id) and (p_context is null or p.context_id=p_context)
 ), comparison as (
  select p.*,coalesce((select sum(py.amount_minor) from shared_expense_payers py join included e on e.id=py.expense_id where py.participant_id=p.id),0)::bigint paid_minor,
  coalesce((select sum(sh.amount_minor) from shared_expense_shares sh join included e on e.id=sh.expense_id where sh.participant_id=p.id),0)::bigint share_minor from people p
 )
 select jsonb_build_object(
 'totals',jsonb_build_object('spending_minor',(select coalesce(sum(amount_minor),0)::bigint from included),'expense_count',(select count(*) from included),
 'paid_minor',(select coalesce(sum(paid_minor),0)::bigint from comparison where user_id=auth.uid()),'share_minor',(select coalesce(sum(share_minor),0)::bigint from comparison where user_id=auth.uid())),
 'categories',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select category,sum(amount_minor)::bigint amount_minor from included group by category order by 2 desc,1)t),
 'timeline',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select date,sum(amount_minor)::bigint amount_minor from included group by date order by date)t),
 'people',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select id,context_id,name,paid_minor,share_minor from comparison order by name,id)t),
 'repayments',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select s.status,sum(s.amount_minor)::bigint amount_minor,count(*) from shared_settlements s where shared_member(s.context_id) and (p_context is null or s.context_id=p_context) and s.date between p_start and p_end group by s.status order by s.status)t)
 ) into result;
 return result;
end $$;
-- CREATE OR REPLACE preserves 018's authenticated-only EXECUTE ACL.
commit;
