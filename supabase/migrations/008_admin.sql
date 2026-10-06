-- Private operator metrics and account deletion. No client can grant admin status.
begin;
create schema if not exists paisatrace_private;
revoke all on schema paisatrace_private from public, anon, authenticated;
create table paisatrace_private.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table paisatrace_private.activity(user_id uuid primary key references auth.users(id) on delete cascade, last_active_at timestamptz not null);
create table paisatrace_private.admin_audit(id bigint generated always as identity primary key, actor_id uuid not null, target_id uuid not null, action text not null, created_at timestamptz not null default now());
alter table paisatrace_private.admins enable row level security;
alter table paisatrace_private.activity enable row level security;
alter table paisatrace_private.admin_audit enable row level security;
revoke all on all tables in schema paisatrace_private from public, anon, authenticated;

create function public.is_paisatrace_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from paisatrace_private.admins a join auth.users u on u.id=a.user_id where a.user_id=auth.uid() and u.email_confirmed_at is not null)
  and exists(select 1 from auth.sessions s where s.user_id=auth.uid() and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>now()));
$$;
create function public.record_paisatrace_activity() returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'Sign in required' using errcode='42501'; end if;
  insert into paisatrace_private.activity(user_id,last_active_at) values(auth.uid(),now())
  on conflict(user_id) do update set last_active_at=excluded.last_active_at where paisatrace_private.activity.last_active_at<now()-interval '5 minutes';
end; $$;
create function public.paisatrace_admin_overview(p_search text default '',p_offset integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.is_paisatrace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_offset<0 or p_offset>1000000 or length(p_search)>254 then raise exception 'Invalid filter'; end if;
  select jsonb_build_object(
    'total',count(*),'signups_7d',count(*) filter(where u.created_at>=now()-interval '7 days'),
    'signups_30d',count(*) filter(where u.created_at>=now()-interval '30 days'),
    'active_7d',count(*) filter(where a.last_active_at>=now()-interval '7 days'),
    'active_30d',count(*) filter(where a.last_active_at>=now()-interval '30 days'))
  into result from auth.users u left join paisatrace_private.activity a on a.user_id=u.id;
  return result || jsonb_build_object('matched',(select count(*) from auth.users where strpos(lower(coalesce(email,'')),lower(p_search))>0),
    'users',coalesce((select jsonb_agg(to_jsonb(page)) from (
      select u.id,u.email,u.created_at,u.email_confirmed_at,u.last_sign_in_at,a.last_active_at,
        exists(select 1 from paisatrace_private.admins m where m.user_id=u.id) as is_admin
      from auth.users u left join paisatrace_private.activity a on a.user_id=u.id
      where strpos(lower(coalesce(u.email,'')),lower(p_search))>0
      order by u.created_at desc,u.id limit 25 offset p_offset
    )page),'[]'::jsonb));
end; $$;
create function public.paisatrace_admin_delete_user(p_user_id uuid,p_confirm_email text) returns void language plpgsql security definer set search_path='' as $$
declare target_email text;
begin
  if not public.is_paisatrace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and last_sign_in_at>now()-interval '15 minutes') then raise exception 'Sign out and sign in again before deleting an account'; end if;
  -- Preserve operator accounts, including the caller, and serialize against membership changes.
  lock table paisatrace_private.admins in share mode;
  if p_user_id=auth.uid() or exists(select 1 from paisatrace_private.admins where user_id=p_user_id) then raise exception 'Admin accounts cannot be deleted here'; end if;
  select email into target_email from auth.users where id=p_user_id for update;
  if not found then raise exception 'Account no longer exists'; end if;
  if target_email is null or target_email='' or p_confirm_email is null or lower(trim(p_confirm_email))<>lower(target_email) then raise exception 'Type the exact account email to confirm deletion'; end if;
  insert into paisatrace_private.admin_audit(actor_id,target_id,action) values(auth.uid(),p_user_id,'delete_account');
  -- Auth dependent records and all app records reference auth.users with ON DELETE CASCADE.
  -- Any incompatible provider relationship aborts the transaction, including the audit insert.
  delete from auth.users where id=p_user_id;
end; $$;
revoke all on function public.is_paisatrace_admin(),public.record_paisatrace_activity(),public.paisatrace_admin_overview(text,integer),public.paisatrace_admin_delete_user(uuid,text) from public,anon;
grant execute on function public.is_paisatrace_admin(),public.record_paisatrace_activity(),public.paisatrace_admin_overview(text,integer),public.paisatrace_admin_delete_user(uuid,text) to authenticated;
commit;
-- Grant the selected verified operator UUID separately, after checking the account.
