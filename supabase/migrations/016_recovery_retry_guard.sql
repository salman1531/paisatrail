-- Prevent stale create retries from resurrecting a removed ID beside its recovery copy.
begin;
create or replace function public.prevent_removed_entry_retry() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.removed_entries where id=new.id) then raise exception 'This entry was removed. Restore it from Removed entries in Money Log before editing it'; end if;
 return new;
end $$;
revoke all on function public.prevent_removed_entry_retry() from public,anon,authenticated;
drop trigger if exists entry_recovery_retry_guard on public.entries;
create trigger entry_recovery_retry_guard before insert on public.entries for each row execute function public.prevent_removed_entry_retry();
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
 -- Delete and reinsert are one transaction: failures restore the recovery snapshot too.
 delete from public.removed_entries where id=p_id and user_id=owner_id;
 insert into public.entries select e.*;
end $$;
-- Recovery keeps a receipt's classification meaningful while it is outside the active table.
create or replace function public.protect_recoverable_planning_links() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_table_name='income_sources' then
 if new.category_id<>old.category_id and exists(select 1 from public.removed_entries where user_id=old.user_id and entry->>'income_source_id'=old.id::text) then raise exception 'Restore or retain the category used by this source’s recoverable entries'; end if;
 elsif tg_table_name='expected_payments' then
 if (new.currency<>old.currency or new.category_id<>old.category_id or new.source_id is distinct from old.source_id or new.period_start<>old.period_start or new.period_end<>old.period_end) and exists(select 1 from public.removed_entries where user_id=old.user_id and expected_payment_id=old.id) then raise exception 'Recoverable receipts retain their expected payment currency, source and period'; end if;
 end if;
 return new;
end $$;
revoke all on function public.protect_recoverable_planning_links() from public,anon,authenticated;
drop trigger if exists recovery_source_history on public.income_sources;
create trigger recovery_source_history before update on public.income_sources for each row execute function public.protect_recoverable_planning_links();
drop trigger if exists recovery_payment_history on public.expected_payments;
create trigger recovery_payment_history before update on public.expected_payments for each row execute function public.protect_recoverable_planning_links();
commit;
