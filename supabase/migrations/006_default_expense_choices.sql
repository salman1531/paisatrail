begin;

-- Add starter choices once to existing generic expense categories with no children.
insert into public.subcategories(user_id, category_id, name)
select c.user_id, c.id, names.name
from public.categories c
cross join (values ('Groceries'), ('Food & dining'), ('Rent'), ('Bills'), ('Travel'), ('Petrol'), ('Shopping'), ('Other expenses')) as names(name)
where c.kind = 'expense' and c.name = 'Expenses' and not c.archived
  and not exists (select 1 from public.subcategories s where s.category_id = c.id and s.user_id = c.user_id);

create or replace function public.initialize_ledger(p_timezone text default 'UTC') returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare current_user_id uuid := auth.uid(); inserted integer; expense_id uuid;
begin
  if current_user_id is null then raise exception 'Sign in to open a ledger'; end if;
  insert into public.profiles(user_id, timezone) values (current_user_id, p_timezone) on conflict (user_id) do nothing;
  get diagnostics inserted = row_count;
  if inserted > 0 then
    insert into public.categories(user_id, name, kind) values
      (current_user_id, 'Expenses', 'expense'), (current_user_id, 'Savings', 'saving'),
      (current_user_id, 'Investments', 'investment'), (current_user_id, 'Income', 'income');
    select id into expense_id from public.categories where user_id = current_user_id and kind = 'expense' and name = 'Expenses';
    insert into public.subcategories(user_id, category_id, name)
    select current_user_id, expense_id, name
    from (values ('Groceries'), ('Food & dining'), ('Rent'), ('Bills'), ('Travel'), ('Petrol'), ('Shopping'), ('Other expenses')) as names(name);
  end if;
end; $$;

commit;
