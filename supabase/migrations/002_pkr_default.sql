-- New accounts default to PKR. Existing currency choices and amounts remain intact.
alter table public.profiles alter column currency set default 'PKR';
