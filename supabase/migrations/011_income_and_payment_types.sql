-- Income sources and optional expense payment labels. No account numbers or bank access.
begin;
alter table public.entries add column payment_method text;
alter table public.entries add constraint entries_payment_method_label check(payment_method is null or payment_method in ('Cash','Credit Card','Debit Card','Bank Account','Others'));
create function public.validate_entry_payment() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.payment_method is not null and not exists(select 1 from public.categories where id=new.category_id and user_id=new.user_id and kind='expense') then raise exception 'Payment type applies only to expenses'; end if;
 return new;
end; $$;
create trigger entry_payment_check before insert or update on public.entries for each row execute function public.validate_entry_payment();
alter table public.profiles add column income_choices_initialized boolean not null default false;
  insert into public.categories(user_id,name,kind)
  select p.user_id,d.name,'income' from public.profiles p cross join (values
('Salary'),
('Business'),
('Freelance'),
('Gifts'),
('Rental income'),
('Investment returns'),
('Other income')
  )d(name) on conflict (user_id,kind,lower(name)) do nothing;
update public.profiles set income_choices_initialized=true;
create or replace function public.initialize_ledger(p_timezone text default 'UTC') returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_user_id uuid:=auth.uid(); inserted integer;
begin
 if current_user_id is null then raise exception 'Sign in to open a ledger'; end if;
 insert into public.profiles(user_id,timezone) values(current_user_id,p_timezone) on conflict(user_id) do nothing;
 get diagnostics inserted=row_count;
 if inserted>0 then
  insert into public.categories(user_id,name,kind,essential)
  select current_user_id,d.name,d.kind,d.essential from (values
('Food','expense',true),
('Home','expense',true),
('Transport','expense',true),
('Shopping','expense',false),
('Health','expense',true),
('Education','expense',false),
('Leisure','expense',false),
('Family & giving','expense',false),
('Savings','saving',false),
('Investments','investment',false)
  )d(name,kind,essential);
  insert into public.subcategories(user_id,category_id,name,emergency)
  select current_user_id,c.id,d.name,d.emergency from public.categories c join (values
('Food','Groceries',false),
('Food','Dining',false),
('Food','Coffee',false),
('Home','Rent',false),
('Home','Bills',false),
('Home','Home maintenance',false),
('Transport','Petrol',false),
('Transport','Public transport',false),
('Transport','Travel',false),
('Shopping','Clothing',false),
('Shopping','Personal care',false),
('Health','Healthcare',false),
('Health','Insurance',false),
('Health','Fitness',false),
('Education','Tuition',false),
('Education','Books & courses',false),
('Leisure','Entertainment',false),
('Leisure','Subscriptions',false),
('Family & giving','Childcare',false),
('Family & giving','Pets',false),
('Family & giving','Gifts & charity',false),
('Savings','Emergency fund',true),
('Savings','Travel savings',false),
('Savings','Home deposit',false),
('Savings','Car savings',false),
('Savings','Education savings',false),
('Savings','Wedding savings',false),
('Savings','Retirement savings',false),
('Savings','Rainy-day savings',false),
('Investments','Stocks',false),
('Investments','Mutual funds',false),
('Investments','ETFs',false),
('Investments','Bonds',false),
('Investments','Gold',false),
('Investments','Real estate',false),
('Investments','Retirement investments',false)
  )d(parent,name,emergency) on c.name=d.parent
  where c.user_id=current_user_id;
 end if;
 update public.profiles set income_choices_initialized=true where user_id=current_user_id and not income_choices_initialized;
 get diagnostics inserted=row_count;
 if inserted>0 then
  insert into public.categories(user_id,name,kind)
  select current_user_id,d.name,'income' from (values
('Salary'),
('Business'),
('Freelance'),
('Gifts'),
('Rental income'),
('Investment returns'),
('Other income')
  )d(name) on conflict (user_id,kind,lower(name)) do nothing;
 end if;
end; $$;
commit;
