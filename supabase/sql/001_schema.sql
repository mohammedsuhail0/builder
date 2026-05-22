create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  college text not null,
  department text not null,
  year integer not null check (year between 1 and 4),
  skills text[] not null default '{}',
  build_statement text not null check (char_length(build_statement) <= 200),
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) <= 100),
  description text not null check (char_length(description) <= 1000),
  skills_needed text[] not null default '{}',
  image_urls text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_timestamps (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  posted_at timestamptz not null default now(),
  author_name text not null,
  author_college text not null
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  origin_post_id uuid references public.posts(id) on delete set null,
  name text not null check (char_length(name) <= 100),
  description text not null check (char_length(description) <= 2000),
  created_by uuid not null references public.profiles(id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('founder', 'member')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  is_milestone boolean not null default false,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.project_follows (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (
    type in ('dm', 'join_request', 'project_update', 'teammate_update', 'added_to_project')
  ),
  title text not null check (char_length(title) <= 200),
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, college, department, year, build_statement)
  values (new.id, 'New User', 'Unknown College', 'Unknown', 1, 'I want to build...')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- =========================================================================
-- INVITE-ONLY GATEWAY
-- =========================================================================
create table if not exists public.invite_whitelist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Pre-seed some default allowed emails for testing/admin purposes
insert into public.invite_whitelist (email)
values ('admin@buildr.com'), ('suhail@buildr.com')
on conflict (email) do nothing;

create or replace function public.check_user_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.invite_whitelist
    where email = new.email
  ) then
    raise exception 'This email is not invited to Buildr.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_user_invite on auth.users;
create trigger trg_check_user_invite
before insert on auth.users
for each row execute function public.check_user_invite();

-- =========================================================================
-- IMMUTABLE TIMESTAMP CONSTRAINT
-- =========================================================================
create or replace function public.enforce_immutable_timestamp()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    new.posted_at = now();
    return new;
  elsif TG_OP = 'UPDATE' then
    raise exception 'Timestamps are immutable and cannot be updated.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_immutable_timestamp on public.idea_timestamps;
create trigger trg_immutable_timestamp
before insert or update on public.idea_timestamps
for each row execute function public.enforce_immutable_timestamp();

-- =========================================================================
-- DISTRIBUTED SERVERLESS RATE LIMITER
-- =========================================================================
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null
);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  ok boolean,
  retry_after_sec integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_reset_at timestamptz;
  v_count integer;
begin
  -- Proactive automatic pruning of expired entries
  delete from public.rate_limits where reset_at < v_now;

  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  on conflict (key) do update
  set count = case
    when public.rate_limits.reset_at < v_now then 1
    else public.rate_limits.count + 1
  end,
  reset_at = case
    when public.rate_limits.reset_at < v_now then v_now + (p_window_seconds || ' seconds')::interval
    else public.rate_limits.reset_at
  end
  returning public.rate_limits.count, public.rate_limits.reset_at
  into v_count, v_reset_at;

  if v_count > p_limit then
    return query select false, ceil(extract(epoch from (v_reset_at - v_now)))::integer;
  else
    return query select true, ceil(extract(epoch from (v_reset_at - v_now)))::integer;
  end if;
end;
$$;

-- =========================================================================
-- PERFORMANCE SCALING DATABASE INDEXES
-- =========================================================================
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_idea_timestamps_author_id on public.idea_timestamps(author_id);
create index if not exists idx_projects_created_by on public.projects(created_by);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_updates_project_id on public.project_updates(project_id);
create index if not exists idx_project_follows_user_id on public.project_follows(user_id);
create index if not exists idx_messages_sender_recipient on public.messages(sender_id, recipient_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

