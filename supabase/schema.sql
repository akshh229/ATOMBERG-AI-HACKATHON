create extension if not exists "pgcrypto";

create type app_role as enum ('Employee', 'Manager', 'Admin');
create type goal_sheet_state as enum ('Draft', 'Submitted', 'Returned', 'Approved', 'Locked');
create type uom_type as enum ('Numeric', 'Percentage', 'Timeline', 'Zero-based');
create type progress_direction as enum ('Min', 'Max');
create type quarter_type as enum ('Q1', 'Q2', 'Q3', 'Q4');
create type goal_status as enum ('Not Started', 'On Track', 'Completed');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role app_role not null,
  title text not null,
  department text not null,
  manager_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.goal_sheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.users(id) on delete cascade,
  cycle text not null,
  state goal_sheet_state not null default 'Draft',
  returned_comment text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, cycle)
);

create table public.shared_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  thrust_area text not null,
  target text not null,
  uom_type uom_type not null,
  progress_direction progress_direction not null default 'Min',
  primary_owner_id uuid not null references public.users(id),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.goal_sheets(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  shared_goal_id uuid references public.shared_goals(id) on delete set null,
  thrust_area text not null,
  title text not null,
  description text not null,
  uom_type uom_type not null,
  progress_direction progress_direction not null default 'Min',
  target text not null,
  weightage numeric(5,2) not null check (weightage >= 10),
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shared_goal_links (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references public.shared_goals(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shared_goal_id, employee_id)
);

create table public.goal_updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  quarter quarter_type not null,
  actual text not null,
  status goal_status not null,
  blocked boolean not null default false,
  progress_score numeric(6,2) not null default 0,
  submitted_at timestamptz not null default now(),
  unique (goal_id, quarter)
);

create table public.manager_comments (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.goal_sheets(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  manager_id uuid not null references public.users(id),
  quarter quarter_type not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.cycle_windows (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  quarter quarter_type,
  starts_at date not null,
  ends_at date not null,
  active boolean not null default false,
  check (starts_at <= ends_at)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.goal_sheets enable row level security;
alter table public.goals enable row level security;
alter table public.shared_goals enable row level security;
alter table public.shared_goal_links enable row level security;
alter table public.goal_updates enable row level security;
alter table public.manager_comments enable row level security;
alter table public.cycle_windows enable row level security;
alter table public.audit_logs enable row level security;

create index users_manager_id_idx on public.users(manager_id);
create index goal_sheets_employee_cycle_idx on public.goal_sheets(employee_id, cycle);
create index goals_sheet_id_idx on public.goals(sheet_id);
create index goal_updates_goal_quarter_idx on public.goal_updates(goal_id, quarter);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger goal_sheets_touch_updated_at
before update on public.goal_sheets
for each row execute function public.touch_updated_at();

create trigger goals_touch_updated_at
before update on public.goals
for each row execute function public.touch_updated_at();

create or replace function public.goal_sheet_validation_errors(target_sheet_id uuid)
returns text[]
language plpgsql
stable
as $$
declare
  errors text[] := '{}';
  goal_count integer;
  total_weightage numeric;
  invalid_required integer;
  invalid_weightage integer;
begin
  select
    count(*),
    coalesce(sum(weightage), 0),
    count(*) filter (where weightage < 10),
    count(*) filter (
      where trim(title) = ''
        or trim(description) = ''
        or trim(thrust_area) = ''
        or trim(target) = ''
    )
  into goal_count, total_weightage, invalid_weightage, invalid_required
  from public.goals
  where sheet_id = target_sheet_id;

  if goal_count = 0 then
    errors := array_append(errors, 'At least one goal is required.');
  end if;

  if goal_count > 8 then
    errors := array_append(errors, 'Maximum 8 goals are allowed per employee.');
  end if;

  if total_weightage <> 100 then
    errors := array_append(errors, 'Total weightage must equal 100%.');
  end if;

  if invalid_weightage > 0 then
    errors := array_append(errors, 'Minimum weightage per goal is 10%.');
  end if;

  if invalid_required > 0 then
    errors := array_append(errors, 'All required goal fields must be complete.');
  end if;

  return errors;
end;
$$;

create or replace function public.enforce_goal_sheet_state_rules()
returns trigger
language plpgsql
as $$
declare
  errors text[];
begin
  if old.state <> new.state then
    if not (
      (old.state = 'Draft' and new.state = 'Submitted')
      or (old.state = 'Returned' and new.state = 'Submitted')
      or (old.state = 'Submitted' and new.state in ('Returned', 'Approved', 'Locked'))
      or (old.state = 'Approved' and new.state in ('Returned', 'Locked'))
      or (old.state = 'Locked' and new.state = 'Returned')
    ) then
      raise exception 'Invalid state transition from % to %.', old.state, new.state;
    end if;
  end if;

  if new.state = 'Returned' and coalesce(trim(new.returned_comment), '') = '' then
    raise exception 'Returned sheets require a non-empty comment.';
  end if;

  if new.state in ('Submitted', 'Approved', 'Locked') then
    errors := public.goal_sheet_validation_errors(new.id);
    if array_length(errors, 1) is not null then
      raise exception 'Goal sheet validation failed: %', array_to_string(errors, ' ');
    end if;
  end if;

  if new.state = 'Locked' and old.state <> 'Locked' then
    new.locked_at = coalesce(new.locked_at, now());
    update public.goals set locked = true where sheet_id = new.id;
  end if;

  if new.state in ('Draft', 'Returned') and old.state = 'Locked' then
    update public.goals set locked = false where sheet_id = new.id;
  end if;

  return new;
end;
$$;

create trigger goal_sheet_state_rules
before update of state on public.goal_sheets
for each row execute function public.enforce_goal_sheet_state_rules();

create or replace function public.prevent_locked_goal_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.locked = true and new.locked = true then
    raise exception 'Locked goals cannot be edited until Admin unlocks the goal sheet.';
  end if;
  return new;
end;
$$;

create trigger locked_goal_mutation_guard
before update on public.goals
for each row execute function public.prevent_locked_goal_mutation();

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

create policy users_select_visible
on public.users
for select
using (
  public.current_app_role() = 'Admin'
  or id = public.current_app_user_id()
  or manager_id = public.current_app_user_id()
);

create policy goal_sheets_select_visible
on public.goal_sheets
for select
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy goal_sheets_employee_insert
on public.goal_sheets
for insert
with check (
  employee_id = public.current_app_user_id()
  or public.current_app_role() = 'Admin'
);

create policy goal_sheets_update_by_role
on public.goal_sheets
for update
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
)
with check (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy goals_select_visible
on public.goals
for select
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy goals_insert_owner_or_admin
on public.goals
for insert
with check (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy goals_update_visible_roles
on public.goals
for update
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
)
with check (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy shared_goals_select_visible
on public.shared_goals
for select
using (
  public.current_app_role() = 'Admin'
  or primary_owner_id = public.current_app_user_id()
  or public.is_direct_manager(primary_owner_id)
  or exists (
    select 1
    from public.shared_goal_links link
    where link.shared_goal_id = shared_goals.id
      and (
        link.employee_id = public.current_app_user_id()
        or public.is_direct_manager(link.employee_id)
      )
  )
);

create policy shared_goals_write_manager_admin
on public.shared_goals
for all
using (public.current_app_role() in ('Admin', 'Manager'))
with check (public.current_app_role() in ('Admin', 'Manager'));

create policy shared_goal_links_visible
on public.shared_goal_links
for select
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy shared_goal_links_write_manager_admin
on public.shared_goal_links
for all
using (public.current_app_role() in ('Admin', 'Manager'))
with check (public.current_app_role() in ('Admin', 'Manager'));

create policy goal_updates_select_visible
on public.goal_updates
for select
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
  or public.is_direct_manager(employee_id)
);

create policy goal_updates_employee_insert_update
on public.goal_updates
for all
using (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
)
with check (
  public.current_app_role() = 'Admin'
  or employee_id = public.current_app_user_id()
);

create policy manager_comments_select_visible
on public.manager_comments
for select
using (
  public.current_app_role() = 'Admin'
  or manager_id = public.current_app_user_id()
  or exists (
    select 1
    from public.goal_sheets gs
    where gs.id = sheet_id
      and gs.employee_id = public.current_app_user_id()
  )
);

create policy manager_comments_insert_manager_admin
on public.manager_comments
for insert
with check (
  public.current_app_role() = 'Admin'
  or manager_id = public.current_app_user_id()
);

create policy cycle_windows_select_all_authenticated
on public.cycle_windows
for select
using (auth.uid() is not null);

create policy cycle_windows_admin_write
on public.cycle_windows
for all
using (public.current_app_role() = 'Admin')
with check (public.current_app_role() = 'Admin');

create policy audit_logs_select_admin_manager_scope
on public.audit_logs
for select
using (
  public.current_app_role() = 'Admin'
  or actor_id = public.current_app_user_id()
);

create policy audit_logs_insert_authenticated
on public.audit_logs
for insert
with check (auth.uid() is not null);
