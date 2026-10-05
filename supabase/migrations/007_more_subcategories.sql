begin;
alter table public.subcategories add column emergency boolean not null default false;
create or replace function public.validate_subcategory() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare parent public.categories;
begin
 if tg_op='UPDATE' and (new.id<>old.id or new.user_id<>old.user_id or new.category_id<>old.category_id) then raise exception 'Subcategory ownership and parent cannot be changed'; end if;
 select * into parent from public.categories where id=new.category_id and user_id=new.user_id;
 if not found or parent.kind not in ('expense','saving','investment') then raise exception 'Choose an expense, savings or investment category'; end if;
 if new.emergency and parent.kind<>'saving' then raise exception 'Only savings subcategories count toward the emergency fund'; end if;
 if parent.archived and (tg_op='INSERT' or (old.archived and not new.archived)) then raise exception 'Choose an active category'; end if;
 return new;
end; $$;

insert into public.subcategories(user_id,category_id,name,emergency)
  select c.user_id,c.id,d.name,d.emergency
  from public.categories c join (values
    ('expense','Groceries',false),
    ('expense','Food & dining',false),
    ('expense','Rent',false),
    ('expense','Bills',false),
    ('expense','Travel',false),
    ('expense','Petrol',false),
    ('expense','Shopping',false),
    ('expense','Other expenses',false),
    ('expense','Healthcare',false),
    ('expense','Education',false),
    ('expense','Entertainment',false),
    ('expense','Subscriptions',false),
    ('expense','Insurance',false),
    ('expense','Home maintenance',false),
    ('expense','Gifts & charity',false),
    ('expense','Childcare',false),
    ('expense','Fitness',false),
    ('expense','Personal care',false),
    ('expense','Pets',false),
    ('saving','Emergency fund',true),
    ('saving','Travel savings',false),
    ('saving','Home deposit',false),
    ('saving','Car savings',false),
    ('saving','Education savings',false),
    ('saving','Wedding savings',false),
    ('saving','Retirement savings',false),
    ('saving','Rainy-day savings',false),
    ('saving','Other savings',false),
    ('investment','Stocks',false),
    ('investment','Mutual funds',false),
    ('investment','ETFs',false),
    ('investment','Bonds',false),
    ('investment','Gold',false),
    ('investment','Real estate',false),
    ('investment','Retirement investments',false),
    ('investment','Other investments',false)
  ) as d(kind,name,emergency) on c.kind=d.kind
  where not c.archived and c.name=case c.kind when 'expense' then 'Expenses' when 'saving' then 'Savings' when 'investment' then 'Investments' end
  
  on conflict (user_id,category_id,lower(name)) do nothing;
create or replace function public.initialize_ledger(p_timezone text default 'UTC') returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_user_id uuid:=auth.uid(); inserted integer;
begin
 if current_user_id is null then raise exception 'Sign in to open a ledger'; end if;
 insert into public.profiles(user_id,timezone) values(current_user_id,p_timezone) on conflict(user_id) do nothing;
 get diagnostics inserted=row_count;
 if inserted>0 then
  insert into public.categories(user_id,name,kind) values(current_user_id,'Expenses','expense'),(current_user_id,'Savings','saving'),(current_user_id,'Investments','investment'),(current_user_id,'Income','income');
  insert into public.subcategories(user_id,category_id,name,emergency)
  select c.user_id,c.id,d.name,d.emergency
  from public.categories c join (values
    ('expense','Groceries',false),
    ('expense','Food & dining',false),
    ('expense','Rent',false),
    ('expense','Bills',false),
    ('expense','Travel',false),
    ('expense','Petrol',false),
    ('expense','Shopping',false),
    ('expense','Other expenses',false),
    ('expense','Healthcare',false),
    ('expense','Education',false),
    ('expense','Entertainment',false),
    ('expense','Subscriptions',false),
    ('expense','Insurance',false),
    ('expense','Home maintenance',false),
    ('expense','Gifts & charity',false),
    ('expense','Childcare',false),
    ('expense','Fitness',false),
    ('expense','Personal care',false),
    ('expense','Pets',false),
    ('saving','Emergency fund',true),
    ('saving','Travel savings',false),
    ('saving','Home deposit',false),
    ('saving','Car savings',false),
    ('saving','Education savings',false),
    ('saving','Wedding savings',false),
    ('saving','Retirement savings',false),
    ('saving','Rainy-day savings',false),
    ('saving','Other savings',false),
    ('investment','Stocks',false),
    ('investment','Mutual funds',false),
    ('investment','ETFs',false),
    ('investment','Bonds',false),
    ('investment','Gold',false),
    ('investment','Real estate',false),
    ('investment','Retirement investments',false),
    ('investment','Other investments',false)
  ) as d(kind,name,emergency) on c.kind=d.kind
  where not c.archived and c.name=case c.kind when 'expense' then 'Expenses' when 'saving' then 'Savings' when 'investment' then 'Investments' end
  and c.user_id=current_user_id
  on conflict (user_id,category_id,lower(name)) do nothing;
 end if;
end; $$;
commit;
