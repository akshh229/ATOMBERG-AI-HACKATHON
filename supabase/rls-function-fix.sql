-- Fix RLS helper recursion.
--
-- Run this once if schema.sql was applied before the helper functions were
-- marked SECURITY DEFINER. Without this, policies that call current_app_role()
-- or current_app_user_id() can recursively invoke users table RLS.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from public.users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.is_direct_manager(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users employee
    where employee.id = target_employee_id
      and employee.manager_id = public.current_app_user_id()
  )
$$;
