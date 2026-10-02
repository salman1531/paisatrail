-- Run once in the Supabase SQL editor, or with `supabase db push`.
begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'USD' check (currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
  timezone text not null default 'UTC' check (length(timezone) between 1 and 100),
  income_target bigint not null default 0 check (income_target between 0 and 1000000000000),
  spending_target bigint not null default 0 check (spending_target between 0 and 1000000000000),
  investment_target bigint not null default 0 check (investment_target between 0 and 1000000000000),
  emergency_target bigint not null default 0 check (emergency_target between 0 and 1000000000000),
  emergency_contribution bigint not null default 0 check (emergency_contribution between 0 and 1000000000000)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60 and name = trim(name)),
  kind text not null check (kind in ('expense','saving','investment','income')),
  archived boolean not null default false,
  essential boolean not null default false,
  emergency boolean not null default false,
  created_at timestamptz not null default now(),
  unique(id, user_id),
  check (not essential or kind = 'expense'),
  check (not emergency or kind = 'saving')
);
create unique index category_names on public.categories(user_id, kind, lower(name));
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  date date not null check (date between '1900-01-01' and '2100-12-31'),
  amount_minor bigint not null check (amount_minor between 1 and 1000000000000),
  currency text not null check (currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD')),
  notes text not null default '' check (length(notes) <= 500),
  withdrawal boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories(id, user_id) deferrable initially deferred
);
create index entries_owner_period on public.entries(user_id, date desc, id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;

create policy profile_select on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profile_update on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy category_owner on public.categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy entry_owner on public.entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Remove provider default grants too, then grant only the operations the app needs.
revoke all on public.profiles, public.categories, public.entries from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories, public.entries to authenticated;

create function public.validate_category_update() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.kind <> old.kind or new.user_id <> old.user_id or new.id <> old.id then
    raise exception 'Category type and ownership cannot be changed';
  end if;
  return new;
end; $$;
create trigger category_consistency before update on public.categories for each row execute function public.validate_category_update();

create function public.validate_entry() returns trigger language plpgsql set search_path = public, pg_temp as $$
declare c public.categories;
begin
  select * into c from public.categories where id = new.category_id and user_id = new.user_id;
  if not found then raise exception 'Category is not available to this user'; end if;
  if c.archived and (tg_op = 'INSERT' or new.category_id <> old.category_id) then raise exception 'Choose an active category'; end if;
  if new.withdrawal and c.kind not in ('saving','investment') then raise exception 'Only savings and investments support withdrawals'; end if;
  if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.id <> old.id) then raise exception 'Entry ownership cannot be changed'; end if;
  return new;
end; $$;
create trigger entry_consistency before insert or update on public.entries for each row execute function public.validate_entry();

create function public.validate_profile() returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then raise exception 'Invalid timezone'; end if;
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then raise exception 'Profile ownership cannot be changed'; end if;
  if tg_op = 'UPDATE' and new.currency <> old.currency and (new.income_target <> 0 or new.spending_target <> 0 or new.investment_target <> 0 or new.emergency_target <> 0 or new.emergency_contribution <> 0) then
    raise exception 'Reset planning targets when changing currency';
  end if;
  return new;
end; $$;
create trigger profile_consistency before insert or update on public.profiles for each row execute function public.validate_profile();

create function public.initialize_ledger(p_timezone text default 'UTC') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare current_user_id uuid := auth.uid(); inserted integer;
begin
  if current_user_id is null then raise exception 'Sign in to open a ledger'; end if;
  insert into public.profiles(user_id, timezone) values (current_user_id, p_timezone) on conflict (user_id) do nothing;
  get diagnostics inserted = row_count;
  -- Seed exactly once. Deleting a default category must not recreate it on each sign-in.
  if inserted > 0 then
    insert into public.categories(user_id, name, kind) values
      (current_user_id, 'Expenses', 'expense'), (current_user_id, 'Savings', 'saving'),
      (current_user_id, 'Investments', 'investment'), (current_user_id, 'Income', 'income');
  end if;
end; $$;
revoke all on function public.initialize_ledger(text) from public, anon;
grant execute on function public.initialize_ledger(text) to authenticated;
revoke all on function public.validate_category_update(), public.validate_entry(), public.validate_profile() from public, anon, authenticated;

commit;
