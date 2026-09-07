-- profiles: one row per auth.users row, carrying app-level role/approval
-- state. Rows are created only by the trigger below (never a direct client
-- insert) and removed only via auth.admin.deleteUser cascading the FK.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role user_role not null default 'staff',
  status staff_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every new Supabase Auth user starts as pending staff. The first admin is
-- promoted manually (see README/runbook) - there is no self-serve path to
-- the admin role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'staff',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS helpers. SECURITY DEFINER + a pinned search_path lets these read
-- `profiles` regardless of that table's own RLS (avoiding recursive policy
-- evaluation) and prevents search_path hijacking.
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_staff()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'admin' or status = 'approved')
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin_only"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- No insert policy: rows are created only by the on_auth_user_created
-- trigger (security definer), never by a direct client insert.
-- No delete policy: staff removal goes through supabase.auth.admin.deleteUser
-- (service_role, bypasses RLS), which cascades this row via the FK - that
-- also revokes the account's ability to log in, not just hides it.
