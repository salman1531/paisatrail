begin;

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 60 and name = trim(name)),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id, category_id),
  foreign key (category_id, user_id) references public.categories(id, user_id)
);
create unique index subcategory_names on public.subcategories(user_id, category_id, lower(name));
create index subcategories_parent on public.subcategories(user_id, category_id);

create function public.validate_subcategory() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare parent public.categories;
begin
  if tg_op = 'UPDATE' and (new.id <> old.id or new.user_id <> old.user_id or new.category_id <> old.category_id) then
    raise exception 'Subcategory ownership and parent cannot be changed';
  end if;
  select * into parent from public.categories where id = new.category_id and user_id = new.user_id;
  if not found or parent.kind <> 'expense' then raise exception 'Choose an expense category'; end if;
  if parent.archived and (tg_op = 'INSERT' or (old.archived and not new.archived)) then
    raise exception 'Choose an active expense category';
  end if;
  return new;
end; $$;
create trigger subcategory_consistency before insert or update on public.subcategories
  for each row execute function public.validate_subcategory();

alter table public.entries add column subcategory_id uuid;
alter table public.entries add constraint entries_subcategory_owner_parent
  foreign key (subcategory_id, user_id, category_id)
  references public.subcategories(id, user_id, category_id) deferrable initially deferred;
create index entries_subcategory on public.entries(user_id, subcategory_id) where subcategory_id is not null;

create or replace function public.validate_entry() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare c public.categories; s public.subcategories;
begin
  select * into c from public.categories where id = new.category_id and user_id = new.user_id;
  if not found then raise exception 'Category is not available to this user'; end if;
  if c.archived and (tg_op = 'INSERT' or new.category_id <> old.category_id) then raise exception 'Choose an active category'; end if;
  if new.subcategory_id is not null then
    select * into s from public.subcategories where id = new.subcategory_id and user_id = new.user_id and category_id = new.category_id;
    if not found then raise exception 'Subcategory does not belong to this category'; end if;
    if s.archived and (tg_op = 'INSERT' or new.subcategory_id is distinct from old.subcategory_id) then raise exception 'Choose an active subcategory'; end if;
  end if;
  if new.withdrawal and c.kind not in ('saving','investment') then raise exception 'Only savings and investments support withdrawals'; end if;
  if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.id <> old.id) then raise exception 'Entry ownership cannot be changed'; end if;
  return new;
end; $$;

alter table public.subcategories enable row level security;
create policy subcategory_owner on public.subcategories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.subcategories from public, anon, authenticated;
grant select, insert, update, delete on public.subcategories to authenticated;
revoke all on function public.validate_subcategory() from public, anon, authenticated;

commit;
