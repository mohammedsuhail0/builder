-- =========================================================================
-- SOCIAL LAYER: REACTIONS, COMMENTS, AND USER FOLLOWS
-- =========================================================================

-- 1. POST REACTIONS (LIKES)
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id, reaction)
);

alter table public.post_reactions enable row level security;

drop policy if exists "post_reactions_select_authenticated" on public.post_reactions;
create policy "post_reactions_select_authenticated"
on public.post_reactions
for select
to authenticated
using (true);

drop policy if exists "post_reactions_manage_self" on public.post_reactions;
create policy "post_reactions_manage_self"
on public.post_reactions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2. COMMENTS
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated"
on public.comments
for select
to authenticated
using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
on public.comments
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self"
on public.comments
for delete
to authenticated
using (auth.uid() = author_id);

-- 3. USER FOLLOWS (SOCIAL GRAPH)
create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.user_follows enable row level security;

drop policy if exists "user_follows_select_authenticated" on public.user_follows;
create policy "user_follows_select_authenticated"
on public.user_follows
for select
to authenticated
using (true);

drop policy if exists "user_follows_manage_self" on public.user_follows;
create policy "user_follows_manage_self"
on public.user_follows
for all
to authenticated
using (auth.uid() = follower_id)
with check (auth.uid() = follower_id);

-- 4. PERFORMANCE INDEXES
create index if not exists idx_post_reactions_post_id on public.post_reactions(post_id);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_created_at on public.comments(created_at asc);
create index if not exists idx_user_follows_following_id on public.user_follows(following_id);
