-- Preserve legacy planning amounts in their original currency. Existing hierarchies remain untouched.
begin;
alter table public.profiles add column planning_currency text;
update public.profiles set planning_currency=currency;
alter table public.profiles alter column planning_currency set not null;
alter table public.profiles alter column planning_currency set default 'PKR';
alter table public.profiles add constraint profiles_planning_currency_check check(planning_currency in ('USD','PKR','EUR','GBP','AED','JPY','KWD'));

create or replace function public.validate_profile() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone'; end if;
 if tg_op='UPDATE' and new.user_id<>old.user_id then raise exception 'Profile ownership cannot be changed'; end if;
 if tg_op='UPDATE' and new.planning_currency<>old.planning_currency and (new.income_target<>0 or new.spending_target<>0 or new.saving_target<>0 or new.investment_target<>0 or new.emergency_target<>0 or new.emergency_contribution<>0) then raise exception 'Existing planning amounts must keep their currency'; end if;
 return new;
end; $$;

-- Only first-time initialization receives the clearer starter hierarchy.
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
('Investments','investment',false),
('Income','income',false)
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
end; $$;
commit;
