-- =========================================================================
-- ADVANCED AUTHENTICATION & SECURITY
-- =========================================================================

-- 1. Add mandatory password reset flag for admin-provisioned accounts
alter table public.profiles 
add column if not exists requires_password_reset boolean not null default true;

-- For existing users, we'll set it to false so we don't lock out current active users,
-- but all future users (provisioned by admin) will default to true.
update public.profiles set requires_password_reset = false where updated_at < now();

-- 2. Create login history table for Instagram-grade device tracking
create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip_address text,
  user_agent text,
  location text,
  login_at timestamptz not null default now()
);

-- Index for fast lookups when displaying login history to the user
create index if not exists idx_login_history_user_id on public.login_history(user_id);
create index if not exists idx_login_history_login_at on public.login_history(login_at desc);

-- 3. Row Level Security for Login History
alter table public.login_history enable row level security;

drop policy if exists "login_history_select_self" on public.login_history;
create policy "login_history_select_self"
on public.login_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "login_history_insert_self" on public.login_history;
create policy "login_history_insert_self"
on public.login_history
for insert
to authenticated
with check (auth.uid() = user_id);
