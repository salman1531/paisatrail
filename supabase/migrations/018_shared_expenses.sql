-- Independent shared ledger. No mutation touches Personal Finance entities.
begin;
create table public.product_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 personal_enabled boolean not null default false, shared_enabled boolean not null default false,
 last_product text not null default 'personal' check(last_product in ('personal','shared')),
 display_name text not null default 'Member' check(length(trim(display_name)) between 1 and 60), updated_at timestamptz not null default now()
);
create table public.shared_contexts (
 id uuid primary key, kind text not null check(kind in ('group','direct')), name text not null check(length(trim(name)) between 1 and 80),
 description text not null default '' check(length(description)<=500), icon text not null default 'people' check(icon in ('people','home','trip','food','family')),
 group_type text not null default 'Other' check(group_type in ('Trip','Household','Friends','Family','Other')),
 currency text not null default 'PKR' check(currency='PKR'), owner_id uuid references auth.users(id) on delete set null,
 archived boolean not null default false, version integer not null default 1, created_at timestamptz not null default now()
);
create table public.shared_participants (
 id uuid primary key, context_id uuid not null references public.shared_contexts(id), user_id uuid references auth.users(id) on delete set null,
 name text not null check(length(trim(name)) between 1 and 60), active boolean not null default true, created_at timestamptz not null default now(), unique(id,context_id),unique(context_id,user_id)
);
create table public.shared_memberships (
 id uuid primary key default gen_random_uuid(), context_id uuid not null references public.shared_contexts(id), user_id uuid references auth.users(id) on delete set null,
 participant_id uuid not null, active boolean not null default true, joined_at timestamptz not null default now(),
 foreign key(participant_id,context_id) references public.shared_participants(id,context_id), unique(context_id,user_id), unique(participant_id)
);
create index shared_members_user on public.shared_memberships(user_id,active);
create table public.shared_invitations (
 id uuid primary key, context_id uuid not null references public.shared_contexts(id), token_hash text not null unique check(token_hash~'^[a-f0-9]{64}$'),
 claim_participant_id uuid, expires_at timestamptz not null default now()+interval '7 days', revoked_at timestamptz,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 foreign key(claim_participant_id,context_id) references public.shared_participants(id,context_id)
);
create table public.shared_expenses (
 id uuid primary key,context_id uuid not null references public.shared_contexts(id),title text not null check(length(trim(title)) between 1 and 120),
 amount_minor bigint not null check(amount_minor between 1 and 1000000000000),currency text not null default 'PKR' check(currency='PKR'),date date not null check(date between '1900-01-01' and '2100-12-31'),
 category text not null default 'Other' check(category in ('Food & Drinks','Groceries','Transport','Fuel','Accommodation','Shopping','Utilities','Entertainment','Travel','Other')),
 notes text not null default '' check(length(notes)<=500),split_method text not null check(split_method in ('equal','exact','percentage')),
 created_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),cancelled boolean not null default false,version integer not null default 1,
 unique(id,context_id)
);
create index shared_expense_context_date on public.shared_expenses(context_id,date desc,id);
create table public.shared_expense_payers (
 expense_id uuid not null,context_id uuid not null,participant_id uuid not null,amount_minor bigint not null check(amount_minor>0),
 primary key(expense_id,participant_id),foreign key(expense_id,context_id) references public.shared_expenses(id,context_id),foreign key(participant_id,context_id) references public.shared_participants(id,context_id)
);
create table public.shared_expense_shares (
 expense_id uuid not null,context_id uuid not null,participant_id uuid not null,amount_minor bigint not null check(amount_minor>=0),weight integer,
 primary key(expense_id,participant_id),foreign key(expense_id,context_id) references public.shared_expenses(id,context_id),foreign key(participant_id,context_id) references public.shared_participants(id,context_id)
);
create table public.shared_settlements (
 id uuid primary key,context_id uuid not null references public.shared_contexts(id),payer_id uuid not null,receiver_id uuid not null,amount_minor bigint not null check(amount_minor between 1 and 1000000000000),currency text not null default 'PKR' check(currency='PKR'),
 date date not null check(date between '1900-01-01' and '2100-12-31'),method text not null check(method in ('Cash','Bank transfer','Mobile wallet','Other')),notes text not null default '' check(length(notes)<=500),
 status text not null check(status in ('pending','confirmed','cancelled')),created_by uuid references auth.users(id) on delete set null,confirmed_by uuid references auth.users(id) on delete set null,manual_record boolean not null default false,
 version integer not null default 1,created_at timestamptz not null default now(),confirmed_at timestamptz,check(payer_id<>receiver_id),
 foreign key(payer_id,context_id) references public.shared_participants(id,context_id),foreign key(receiver_id,context_id) references public.shared_participants(id,context_id)
);
create index shared_settlement_context on public.shared_settlements(context_id,created_at desc);
create table public.shared_activity (
 id uuid primary key default gen_random_uuid(),context_id uuid not null references public.shared_contexts(id),actor_id uuid references auth.users(id) on delete set null,actor_name text not null,
 action text not null,entity_id uuid,detail jsonb not null default '{}',created_at timestamptz not null default now()
);
create index shared_activity_context on public.shared_activity(context_id,created_at desc,id);
-- Private command receipts and rate buckets are never exposed as REST-readable data.
create table public.shared_commands(id uuid primary key,actor_id uuid references auth.users(id) on delete set null,payload jsonb not null,result jsonb not null,created_at timestamptz not null default now());
create table public.shared_rate_limits(user_id uuid references auth.users(id) on delete cascade,bucket timestamptz,attempts integer not null,primary key(user_id,bucket));

create function public.shared_member(p_context uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select auth.uid() is not null and exists(select 1 from shared_memberships where context_id=p_context and user_id=auth.uid() and active)
$$;
create function public.shared_owner(p_context uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select public.shared_member(p_context) and exists(select 1 from shared_contexts where id=p_context and owner_id=auth.uid())
$$;
alter table public.product_preferences enable row level security;
create policy own_products on public.product_preferences for select to authenticated using(user_id=auth.uid());
do $$declare t text;begin
 foreach t in array array['shared_contexts','shared_participants','shared_memberships','shared_invitations','shared_expenses','shared_expense_payers','shared_expense_shares','shared_settlements','shared_activity','shared_commands','shared_rate_limits'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  if t not in ('shared_commands','shared_rate_limits','shared_invitations') then
   execute format('create policy member_read on public.%I for select to authenticated using(public.shared_member(%s))',t,case when t='shared_contexts' then 'id' else 'context_id' end);
   execute format('grant select on public.%I to authenticated',t);
  end if;
 end loop;
end $$;
revoke all on public.product_preferences from public,anon,authenticated;grant select on public.product_preferences to authenticated;

create function public.shared_preferences(p_personal boolean default null,p_shared boolean default null,p_last text default null,p_name text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();r product_preferences;begin
 if u is null then raise exception 'Sign in to choose a product';end if;
 insert into product_preferences(user_id,personal_enabled,display_name) values(u,exists(select 1 from profiles where user_id=u),'Member') on conflict do nothing;
 select * into r from product_preferences where user_id=u for update;
 update product_preferences set personal_enabled=coalesce(p_personal,r.personal_enabled) or r.personal_enabled,shared_enabled=coalesce(p_shared,r.shared_enabled) or r.shared_enabled,
 last_product=coalesce(p_last,r.last_product),display_name=coalesce(nullif(trim(p_name),''),r.display_name),updated_at=now() where user_id=u returning * into r;
 if (r.last_product='personal' and not r.personal_enabled or r.last_product='shared' and not r.shared_enabled) and p_last is not null then raise exception 'Enable this product first';end if;
 return to_jsonb(r);
end $$;
-- Only original pairwise obligations, never simplified debt, enter these balances.
create function public.shared_pairs(p_context uuid) returns table(debtor_id uuid,creditor_id uuid,amount_minor bigint) language sql stable security definer set search_path=public,pg_temp as $$
 with movements as (
 select s.participant_id debtor,p.participant_id creditor,s.amount_minor amount from shared_expenses e join shared_expense_shares s on s.expense_id=e.id join shared_expense_payers p on p.expense_id=e.id
 where e.context_id=p_context and not e.cancelled and s.participant_id<>p.participant_id
 union all select payer_id,receiver_id,-amount_minor from shared_settlements where context_id=p_context and status='confirmed'
 ),net as(select least(debtor,creditor) a,greatest(debtor,creditor) b,sum(case when debtor<creditor then amount else -amount end)::bigint n from movements group by 1,2)
 select case when n>0 then a else b end,case when n>0 then b else a end,abs(n) from net where n<>0 and public.shared_member(p_context)
$$;
create function public.shared_audit(p_context uuid,p_action text,p_entity uuid,p_detail jsonb default '{}') returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin insert into shared_activity(context_id,actor_id,actor_name,action,entity_id,detail) values(p_context,auth.uid(),coalesce((select display_name from product_preferences where user_id=auth.uid()),'Member'),p_action,p_entity,p_detail);end $$;
-- Preview is authenticated and reveals only joining context, not members or money.
create function public.shared_invite_preview(p_hash text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r shared_invitations;c shared_contexts;n integer;begin
 if auth.uid() is null then raise exception 'Sign in to open this invitation';end if;
 insert into shared_rate_limits values(auth.uid(),date_trunc('minute',now()),1) on conflict(user_id,bucket) do update set attempts=shared_rate_limits.attempts+1 returning attempts into n;
 if n>20 then return jsonb_build_object('error','Too many attempts. Wait a minute.');end if;
 select * into r from shared_invitations where token_hash=p_hash and revoked_at is null and expires_at>now();
 select * into c from shared_contexts where id=r.context_id and not archived;
 if c.id is null then return jsonb_build_object('error','This invitation is unavailable, expired or revoked.');end if;
 return jsonb_build_object('id',r.id,'context_id',c.id,'name',c.name,'kind',c.kind,'expires_at',r.expires_at,'claim_name',(select name from shared_participants where id=r.claim_participant_id),'claim_participant_id',r.claim_participant_id);
end $$;

-- One authoritative mutation boundary: context row locks serialize money, role and membership changes.
create function public.shared_mutate(p_command uuid,p_action text,p_context uuid default null,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();c shared_contexts;m shared_memberships;old_e shared_expenses;new_e shared_expenses;old_s shared_settlements;inv shared_invitations;person shared_participants;
 result jsonb:='{}';payload jsonb;receipt shared_commands;eid uuid;pid uuid;rid uuid;row_data jsonb;shares jsonb;amount bigint;sum_value bigint;count_value integer;sum_weight bigint;base_sum bigint;remainder integer;v integer;i integer;debt bigint;reserved bigint;mine uuid;receiver_user uuid;payer_user uuid;was_manual boolean;before_detail jsonb;
begin
 if u is null then raise exception 'Sign in to use Shared Expenses';end if;
 if p_command is null then raise exception 'Missing retry key';end if;
 if p_data ? 'currency' and p_data->>'currency' is distinct from 'PKR' then raise exception 'Shared Expenses currently supports PKR only';end if;
 payload=jsonb_build_object('action',p_action,'context',p_context,'data',p_data);
 -- Serialize retries even when the context does not yet exist.
 perform pg_advisory_xact_lock(hashtextextended(p_command::text,0));
 select * into receipt from shared_commands where id=p_command;
 if found then if receipt.actor_id is distinct from u or receipt.payload<>payload then raise exception 'This request was already used with different values. Refresh before retrying';end if;return receipt.result;end if;
 if not exists(select 1 from product_preferences where user_id=u and shared_enabled) then raise exception 'Enable Shared Expenses first';end if;
 if p_action='create_context' then
  eid=(p_data->>'id')::uuid;pid=(p_data->>'participant_id')::uuid;
  insert into shared_contexts(id,kind,name,description,group_type,icon,owner_id) values(eid,coalesce(p_data->>'kind','group'),trim(p_data->>'name'),coalesce(p_data->>'description',''),coalesce(p_data->>'group_type','Other'),coalesce(p_data->>'icon','people'),u) returning * into c;
  insert into shared_participants(id,context_id,user_id,name) values(pid,c.id,u,(select display_name from product_preferences where user_id=u));
  insert into shared_memberships(context_id,user_id,participant_id) values(c.id,u,pid);
  if p_data->>'friend_name' is not null then
   if c.kind<>'direct' then raise exception 'A manual friend needs a direct context';end if;
   insert into shared_participants(id,context_id,name) values((p_data->>'friend_id')::uuid,c.id,trim(p_data->>'friend_name'));
  end if;
  perform shared_audit(c.id,case when c.kind='direct' then 'Friend relationship created' else 'Group created' end,c.id);
  result=jsonb_build_object('context_id',c.id);
 elsif p_action='join' then
  result=shared_invite_preview(p_data->>'hash');if result ? 'error' then return result;end if;
  select * into inv from shared_invitations where token_hash=p_data->>'hash' and revoked_at is null and expires_at>now();
  if inv.id is null then raise exception 'This invitation is unavailable, expired or revoked';end if;
  select * into c from shared_contexts where id=inv.context_id for update;
  if not exists(select 1 from shared_invitations where id=inv.id and revoked_at is null and expires_at>now()) then raise exception 'This invitation is unavailable, expired or revoked';end if;
  if c.archived then raise exception 'This group is archived';end if;
  select * into m from shared_memberships where context_id=c.id and user_id=u;
  if m.active and (inv.claim_participant_id is null or m.participant_id=inv.claim_participant_id) then
   result=jsonb_build_object('context_id',c.id);
  else
   if c.kind='direct' and exists(select 1 from shared_memberships where context_id=c.id and active and user_id is distinct from u and user_id<>c.owner_id) then raise exception 'This friend relationship already has two members';end if;
   if inv.claim_participant_id is not null then
    if not coalesce((p_data->>'confirm_claim')::boolean,false) then raise exception 'Confirm that you accept this participant history';end if;
    select * into person from shared_participants where id=inv.claim_participant_id and context_id=c.id for update;
    if person.user_id is not null or not person.active then raise exception 'This participant is already linked or inactive';end if;
    if m.id is not null then raise exception 'You are already a member. Ask the owner to resolve your existing membership before claiming another history';end if;
    pid=person.id;
    update shared_participants set user_id=u where id=pid;
    perform shared_audit(c.id,'Participant history linked',pid,jsonb_build_object('participant_name',person.name));
   else
    if c.kind='direct' and exists(select 1 from shared_participants where context_id=c.id and active and user_id is null) then raise exception 'Ask the owner for a link to the existing manual friend';end if;
    if m.id is not null then pid=m.participant_id;update shared_participants set active=true where id=pid;
    else pid=(p_data->>'participant_id')::uuid;insert into shared_participants(id,context_id,user_id,name) values(pid,c.id,u,(select display_name from product_preferences where user_id=u));end if;
   end if;
   insert into shared_memberships(context_id,user_id,participant_id) values(c.id,u,pid) on conflict(context_id,user_id) do update set active=true;
   perform shared_audit(c.id,'Member joined',pid);result=jsonb_build_object('context_id',c.id);
  end if;
 else
  select * into c from shared_contexts where id=p_context for update;
  if c.id is null or not shared_member(c.id) then raise exception 'This shared space is unavailable' using errcode='42501';end if;
  select participant_id into mine from shared_memberships where context_id=c.id and user_id=u and active;
  if p_action in ('edit_context','invite','revoke_invite','remove_member','transfer_owner') and c.owner_id is distinct from u then raise exception 'Only the owner can manage this action' using errcode='42501';end if;
  if c.archived and p_action not in ('edit_context','cancel_settlement','leave','remove_member','transfer_owner','revoke_invite') then raise exception 'This space is archived and read-only';end if;
  if p_action='edit_context' then
   if (p_data->>'version')::integer is distinct from c.version then raise exception 'This group changed. Refresh before saving';end if;
   if coalesce((p_data->>'archived')::boolean,false) and exists(select 1 from shared_pairs(c.id)) and not coalesce((p_data->>'confirm_balances')::boolean,false) then raise exception 'Confirm archiving with outstanding balances';end if;
   update shared_contexts set name=trim(p_data->>'name'),description=coalesce(p_data->>'description',''),icon=coalesce(p_data->>'icon',c.icon),group_type=coalesce(p_data->>'group_type',c.group_type),archived=coalesce((p_data->>'archived')::boolean,false),version=version+1 where id=c.id;
   perform shared_audit(c.id,'Group updated',c.id,jsonb_build_object('previous',to_jsonb(c)));
  elsif p_action='add_participant' then
   if c.kind='direct' and (select count(*) from shared_participants where context_id=c.id and active)>=2 then raise exception 'A direct friendship has two participants';end if;
   eid=(p_data->>'id')::uuid;insert into shared_participants(id,context_id,name) values(eid,c.id,trim(p_data->>'name'));
   perform shared_audit(c.id,'Manual participant added',eid,jsonb_build_object('name',trim(p_data->>'name')));
  elsif p_action='invite' then
   pid=nullif(p_data->>'claim_participant_id','')::uuid;
   if pid is not null and not exists(select 1 from shared_participants where id=pid and context_id=c.id and active and user_id is null) then raise exception 'Choose an active manual participant';end if;
   if c.kind='direct' and (select count(*) from shared_memberships where context_id=c.id and active)>=2 then raise exception 'This friendship already has two members';end if;
   update shared_invitations set revoked_at=now() where context_id=c.id and claim_participant_id is not distinct from pid and revoked_at is null;
   insert into shared_invitations(id,context_id,token_hash,claim_participant_id,created_by) values((p_data->>'id')::uuid,c.id,p_data->>'token_hash',pid,u);
   perform shared_audit(c.id,'Invitation created',null);result=jsonb_build_object('expires_at',now()+interval '7 days');
  elsif p_action='revoke_invite' then
   update shared_invitations set revoked_at=now() where context_id=c.id and id=(p_data->>'id')::uuid;
   perform shared_audit(c.id,'Invitation revoked',null);
  elsif p_action in ('remove_member','leave') then
   pid=case when p_action='leave' then mine else (p_data->>'participant_id')::uuid end;
   if not exists(select 1 from shared_participants where context_id=c.id and id=pid and active) then raise exception 'Choose an active participant';end if;
   if exists(select 1 from shared_memberships where participant_id=pid and user_id=c.owner_id) then raise exception 'Transfer ownership before the owner leaves';end if;
   if exists(select 1 from shared_pairs(c.id) where debtor_id=pid or creditor_id=pid) or exists(select 1 from shared_settlements where context_id=c.id and status='pending' and (payer_id=pid or receiver_id=pid)) then raise exception 'Settle outstanding balances and cancel pending repayments before leaving or removing a member';end if;
   update shared_participants set active=false where id=pid;update shared_memberships set active=false where participant_id=pid;
   update shared_invitations set revoked_at=now() where context_id=c.id and claim_participant_id=pid;
   perform shared_audit(c.id,case when p_action='leave' then 'Member left' else 'Member removed' end,pid);
  elsif p_action='transfer_owner' then
   pid=(p_data->>'participant_id')::uuid;
   select user_id into rid from shared_memberships where context_id=c.id and participant_id=pid and active and user_id is not null;
   if rid is null or rid=u then raise exception 'Choose another active registered member';end if;
   update shared_contexts set owner_id=rid,version=version+1 where id=c.id;perform shared_audit(c.id,'Ownership transferred',pid);
  elsif p_action='expense' then
   eid=(p_data->>'id')::uuid;select * into old_e from shared_expenses where id=eid;
   if old_e.id is not null and (old_e.context_id<>c.id or old_e.created_by is distinct from u and c.owner_id is distinct from u) then raise exception 'Only the recorder or owner can correct this expense';end if;
   if old_e.id is not null and (p_data->>'version')::integer is distinct from old_e.version then raise exception 'This expense changed. Refresh before saving';end if;
   if old_e.id is null and (p_data->>'version')::integer<>0 then raise exception 'Expense no longer exists';end if;
   if old_e.id is not null and not coalesce((p_data->>'confirm_change')::boolean,false) then raise exception 'Confirm the effect on shared balances';end if;
   amount=(p_data->>'amount_minor')::bigint;pid=(p_data->>'payer_id')::uuid;shares=p_data->'shares';
   if not exists(select 1 from shared_participants where id=pid and context_id=c.id and (active or old_e.id is not null and exists(select 1 from shared_expense_payers where expense_id=eid and participant_id=pid))) then raise exception 'Choose an active payer';end if;
   if jsonb_typeof(shares)<>'array' or jsonb_array_length(shares) not between 1 and 100 then raise exception 'Choose between 1 and 100 participants';end if;
   if (select count(distinct x->>'participant_id') from jsonb_array_elements(shares) x)<>jsonb_array_length(shares) then raise exception 'Participants must be unique';end if;
   for row_data in select * from jsonb_array_elements(shares) loop
    if not exists(select 1 from shared_participants where id=(row_data->>'participant_id')::uuid and context_id=c.id and (active or old_e.id is not null and exists(select 1 from shared_expense_shares where expense_id=eid and participant_id=(row_data->>'participant_id')::uuid))) then raise exception 'Choose active participants from this space';end if;
   end loop;
   before_detail=case when old_e.id is null then '{}'::jsonb else jsonb_build_object('expense',to_jsonb(old_e),'shares',(select jsonb_agg(to_jsonb(s)) from shared_expense_shares s where expense_id=eid),'payers',(select jsonb_agg(to_jsonb(p)) from shared_expense_payers p where expense_id=eid)) end;
   insert into shared_expenses(id,context_id,title,amount_minor,date,category,notes,split_method,created_by) values(eid,c.id,trim(p_data->>'title'),amount,(p_data->>'date')::date,coalesce(p_data->>'category','Other'),coalesce(p_data->>'notes',''),p_data->>'split_method',u)
   on conflict(id) do update set title=excluded.title,amount_minor=excluded.amount_minor,date=excluded.date,category=excluded.category,notes=excluded.notes,split_method=excluded.split_method,cancelled=false,version=shared_expenses.version+1,updated_at=now();
   delete from shared_expense_payers where expense_id=eid;delete from shared_expense_shares where expense_id=eid;
   insert into shared_expense_payers values(eid,c.id,pid,amount);
   count_value=jsonb_array_length(shares);
   if p_data->>'split_method'='percentage' then
    select sum((x->>'weight')::integer) into sum_weight from jsonb_array_elements(shares) x;
    if sum_weight<>10000 or exists(select 1 from jsonb_array_elements(shares) x where (x->>'weight')::integer<0 or x->>'weight' is null) then raise exception 'Percentages must total 100%%';end if;
   end if;
   -- Largest remainder allocation; UUID order breaks ties identically in the client.
   if p_data->>'split_method' in ('equal','percentage') then
    with weights as(select (x->>'participant_id')::uuid alloc_pid,case when p_data->>'split_method'='equal' then 1 else (x->>'weight')::integer end w from jsonb_array_elements(shares) x),
    bases as(select alloc_pid,w,(amount*w/(case when p_data->>'split_method'='equal' then count_value else 10000 end))::bigint base,(amount*w)%(case when p_data->>'split_method'='equal' then count_value else 10000 end) rem from weights),
    ranked as(select *,row_number() over(order by rem desc,alloc_pid) pos,sum(base) over() total from bases)
    insert into shared_expense_shares select eid,c.id,alloc_pid,base+case when pos<=amount-total then 1 else 0 end,w from ranked;
   else
    insert into shared_expense_shares select eid,c.id,(x->>'participant_id')::uuid,(x->>'amount_minor')::bigint,null from jsonb_array_elements(shares) x;
   end if;
   select sum(amount_minor) into sum_value from shared_expense_shares where expense_id=eid;
   if sum_value is distinct from amount then raise exception 'Allocated shares must equal the expense';end if;
   if old_e.id is not null and (exists(select 1 from shared_expense_shares sh join shared_participants p on p.id=sh.participant_id where sh.expense_id=eid and not p.active and sh.amount_minor is distinct from (select (x->>'amount_minor')::bigint from jsonb_array_elements(before_detail->'shares') x where x->>'participant_id'=sh.participant_id::text)) or exists(select 1 from shared_participants where id=pid and not active) and amount<>old_e.amount_minor) then raise exception 'Keep inactive participants financial shares unchanged';end if;
   -- An expense edit may create credit, but may not invalidate already confirmed repayments.
   if old_e.id is not null and exists(with original as(select least(s.participant_id,p.participant_id) a,greatest(s.participant_id,p.participant_id) b,sum(case when s.participant_id<p.participant_id then s.amount_minor else -s.amount_minor end) n from shared_expenses e join shared_expense_shares s on s.expense_id=e.id join shared_expense_payers p on p.expense_id=e.id where e.context_id=c.id and not e.cancelled and s.participant_id<>p.participant_id group by 1,2),paid as(select least(payer_id,receiver_id) a,greatest(payer_id,receiver_id) b,sum(case when payer_id<receiver_id then amount_minor else -amount_minor end) n from shared_settlements where context_id=c.id and status='confirmed' group by 1,2) select 1 from paid left join original using(a,b) where paid.n<>0 and (coalesce(original.n,0)*paid.n<0 or abs(paid.n)>abs(coalesce(original.n,0)))) then raise exception 'This change conflicts with confirmed repayments. Correct those repayments first';end if;
   perform shared_audit(c.id,case when old_e.id is null then 'Expense added' else 'Expense updated' end,eid,before_detail);result=jsonb_build_object('expense_id',eid);
  elsif p_action in ('cancel_expense','restore_expense') then
   eid=(p_data->>'id')::uuid;select * into old_e from shared_expenses where id=eid and context_id=c.id;
   if old_e.id is null or old_e.created_by is distinct from u and c.owner_id is distinct from u then raise exception 'Only the recorder or owner can change this expense';end if;
   if (p_data->>'version')::integer is distinct from old_e.version then raise exception 'Expense changed. Refresh before saving';end if;
   -- Conservative protection: review/cancel pair repayments before cancelling an expense they can depend on.
   if exists(select 1 from shared_settlements st join shared_expense_shares sh on sh.expense_id=eid join shared_expense_payers py on py.expense_id=eid where st.context_id=c.id and st.status='confirmed' and ((st.payer_id=sh.participant_id and st.receiver_id=py.participant_id) or (st.receiver_id=sh.participant_id and st.payer_id=py.participant_id))) then raise exception 'Correct related confirmed repayments before changing this expense';end if;
   update shared_expenses set cancelled=(p_action='cancel_expense'),version=version+1,updated_at=now() where id=eid;
   perform shared_audit(c.id,case when p_action='cancel_expense' then 'Expense cancelled' else 'Expense restored' end,eid,jsonb_build_object('previous',to_jsonb(old_e)));
  elsif p_action='settlement' then
   eid=(p_data->>'id')::uuid;pid=(p_data->>'payer_id')::uuid;rid=(p_data->>'receiver_id')::uuid;amount=(p_data->>'amount_minor')::bigint;
   if exists(select 1 from shared_settlements where id=eid) then raise exception 'This repayment already exists. Use its correction actions';end if;
   select user_id into payer_user from shared_participants where id=pid and context_id=c.id and active;
   if not found then raise exception 'Choose an active payer';end if;
   select user_id into receiver_user from shared_participants where id=rid and context_id=c.id and active;
   if not found then raise exception 'Choose an active receiver';end if;
   was_manual=payer_user is null or receiver_user is null;
   if not (u=payer_user or u=receiver_user or was_manual and u=c.owner_id) then raise exception 'Only a payment party can record this repayment';end if;
   select amount_minor into debt from shared_pairs(c.id) where debtor_id=pid and creditor_id=rid;
   select coalesce(sum(amount_minor),0) into reserved from shared_settlements where context_id=c.id and payer_id=pid and receiver_id=rid and status='pending';
   if amount is null or amount<=0 or amount>coalesce(debt,0)-reserved then raise exception 'Repayment exceeds the unreserved outstanding debt';end if;
   insert into shared_settlements(id,context_id,payer_id,receiver_id,amount_minor,date,method,notes,status,created_by,confirmed_by,manual_record,confirmed_at) values(eid,c.id,pid,rid,amount,(p_data->>'date')::date,p_data->>'method',coalesce(p_data->>'notes',''),case when was_manual then 'confirmed' else 'pending' end,u,case when was_manual then u end,was_manual,case when was_manual then now() end);
   perform shared_audit(c.id,case when was_manual then 'Manual repayment recorded' else 'Repayment awaiting receipt' end,eid,jsonb_build_object('amount_minor',amount,'payer_id',pid,'receiver_id',rid));
  elsif p_action in ('confirm_settlement','cancel_settlement') then
   eid=(p_data->>'id')::uuid;select * into old_s from shared_settlements where id=eid and context_id=c.id for update;
   if old_s.id is null or old_s.version is distinct from (p_data->>'version')::integer then raise exception 'Repayment changed. Refresh before continuing';end if;
   select user_id into receiver_user from shared_participants where id=old_s.receiver_id;
   select user_id into payer_user from shared_participants where id=old_s.payer_id;
   if p_action='confirm_settlement' then
    if receiver_user is distinct from u or old_s.status<>'pending' then raise exception 'Only the receiver can confirm a pending receipt';end if;
    select amount_minor into debt from shared_pairs(c.id) where debtor_id=old_s.payer_id and creditor_id=old_s.receiver_id;
    if old_s.amount_minor>coalesce(debt,0) then raise exception 'Debt changed. Cancel this request and record a corrected repayment';end if;
    update shared_settlements set status='confirmed',confirmed_by=u,confirmed_at=now(),version=version+1 where id=eid;
   else
    if not (u=payer_user or u=receiver_user or old_s.manual_record and u=c.owner_id) then raise exception 'Only the parties or manual-record owner can cancel this repayment';end if;
    if old_s.status='cancelled' then raise exception 'Repayment is already cancelled';end if;
    update shared_settlements set status='cancelled',version=version+1 where id=eid;
   end if;
   perform shared_audit(c.id,case when p_action='confirm_settlement' then 'Repayment confirmed' else 'Repayment cancelled' end,eid,jsonb_build_object('previous',to_jsonb(old_s)));
  else raise exception 'Unknown shared action';end if;
 end if;
 insert into shared_commands(id,actor_id,payload,result) values(p_command,u,payload,result);return result;
end $$;

create function public.shared_invitation_list(p_context uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin if not shared_owner(p_context) then raise exception 'Owner access required';end if;
return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'context_id',context_id,'claim_participant_id',claim_participant_id,'expires_at',expires_at,'revoked_at',revoked_at) order by created_at desc),'[]') from shared_invitations where context_id=p_context);end $$;
revoke all on function public.shared_invitation_list(uuid) from public,anon,authenticated;grant execute on function public.shared_invitation_list(uuid) to authenticated;
-- Compact authoritative overview: no transaction-history fan-out to the client.
create function public.shared_summary() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('context',to_jsonb(c),'my_participant_id',m.participant_id,'participants',(select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at,p.id),'[]') from shared_participants p where p.context_id=c.id),'pairs',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from shared_pairs(c.id) b),'expense_count',(select count(*) from shared_expenses where context_id=c.id and not cancelled),'total_minor',(select coalesce(sum(amount_minor),0) from shared_expenses where context_id=c.id and not cancelled),'paid_minor',(select coalesce(sum(py.amount_minor),0) from shared_expense_payers py join shared_expenses e on e.id=py.expense_id where e.context_id=c.id and not e.cancelled and py.participant_id=m.participant_id),'share_minor',(select coalesce(sum(sh.amount_minor),0) from shared_expense_shares sh join shared_expenses e on e.id=sh.expense_id where e.context_id=c.id and not e.cancelled and sh.participant_id=m.participant_id)) order by c.created_at desc),'[]')
 from shared_contexts c join shared_memberships m on m.context_id=c.id and m.user_id=auth.uid() and m.active where auth.uid() is not null
$$;
-- Aggregate reports include all matching records even when the visible history is paginated.
create function public.shared_report(p_context uuid default null,p_start date default '1900-01-01',p_end date default '2100-12-31') returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or p_context is not null and not shared_member(p_context) then raise exception 'Shared space unavailable';end if;
 if p_start>p_end then raise exception 'Choose a valid date range';end if;
 return jsonb_build_object('categories',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select e.category,sum(e.amount_minor)::bigint amount_minor from shared_expenses e where shared_member(e.context_id) and (p_context is null or e.context_id=p_context) and not e.cancelled and e.date between p_start and p_end group by e.category order by 2 desc)t),
 'people',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select p.id,p.context_id,p.name,coalesce((select sum(py.amount_minor) from shared_expense_payers py join shared_expenses e on e.id=py.expense_id where py.participant_id=p.id and not e.cancelled and e.date between p_start and p_end),0)::bigint paid_minor,coalesce((select sum(sh.amount_minor) from shared_expense_shares sh join shared_expenses e on e.id=sh.expense_id where sh.participant_id=p.id and not e.cancelled and e.date between p_start and p_end),0)::bigint share_minor from shared_participants p where shared_member(p.context_id) and (p_context is null or p.context_id=p_context))t));
end $$;
-- Account removal preserves collaborators' financial history and transfers ownership when possible.
create function public.shared_identity_removed() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare c shared_contexts;next_owner uuid;begin
 for c in select * from shared_contexts where owner_id=old.id for update loop
  select user_id into next_owner from shared_memberships where context_id=c.id and active and user_id<>old.id order by joined_at,id limit 1;
  update shared_contexts set owner_id=next_owner,archived=case when next_owner is null then true else archived end,version=version+1 where id=c.id;
 end loop;
 update shared_memberships set active=false where user_id=old.id;
 update shared_participants set active=false where user_id=old.id;
 return old;
end $$;
create trigger preserve_shared_history before delete on auth.users for each row execute function public.shared_identity_removed();
revoke all on function public.shared_member(uuid),public.shared_owner(uuid),public.shared_preferences(boolean,boolean,text,text),public.shared_pairs(uuid),public.shared_audit(uuid,text,uuid,jsonb),public.shared_invite_preview(text),public.shared_mutate(uuid,text,uuid,jsonb),public.shared_summary(),public.shared_report(uuid,date,date),public.shared_identity_removed() from public,anon,authenticated;
grant execute on function public.shared_member(uuid),public.shared_owner(uuid),public.shared_preferences(boolean,boolean,text,text),public.shared_pairs(uuid),public.shared_invite_preview(text),public.shared_mutate(uuid,text,uuid,jsonb),public.shared_summary(),public.shared_report(uuid,date,date) to authenticated;
commit;
