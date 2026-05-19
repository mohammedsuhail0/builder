alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.idea_timestamps enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_follows enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
on public.posts
for select
to authenticated
using (deleted_at is null);

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self"
on public.posts
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self"
on public.posts
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "idea_timestamps_select_authenticated" on public.idea_timestamps;
create policy "idea_timestamps_select_authenticated"
on public.idea_timestamps
for select
to authenticated
using (true);

drop policy if exists "idea_timestamps_insert_self" on public.idea_timestamps;
create policy "idea_timestamps_insert_self"
on public.idea_timestamps
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
on public.projects
for select
to authenticated
using (deleted_at is null);

drop policy if exists "projects_insert_self" on public.projects;
create policy "projects_insert_self"
on public.projects
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "projects_update_members" on public.projects;
create policy "projects_update_members"
on public.projects
for update
to authenticated
using (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = id and pm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.project_members pm
    where pm.project_id = id and pm.user_id = auth.uid()
  )
);

drop policy if exists "project_members_select_authenticated" on public.project_members;
create policy "project_members_select_authenticated"
on public.project_members
for select
to authenticated
using (true);

drop policy if exists "project_members_insert_founder" on public.project_members;
create policy "project_members_insert_founder"
on public.project_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid() and pm.role = 'founder'
  )
);

drop policy if exists "project_updates_select_authenticated" on public.project_updates;
create policy "project_updates_select_authenticated"
on public.project_updates
for select
to authenticated
using (true);

drop policy if exists "project_updates_insert_member" on public.project_updates;
create policy "project_updates_insert_member"
on public.project_updates
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_id and pm.user_id = auth.uid()
  )
);

drop policy if exists "project_follows_select_self" on public.project_follows;
create policy "project_follows_select_self"
on public.project_follows
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "project_follows_insert_self" on public.project_follows;
create policy "project_follows_insert_self"
on public.project_follows
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "project_follows_delete_self" on public.project_follows;
create policy "project_follows_delete_self"
on public.project_follows
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
on public.messages
for insert
to authenticated
with check (auth.uid() = sender_id);

drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications_insert_actor" on public.notifications;
create policy "notifications_insert_actor"
on public.notifications
for insert
to authenticated
with check (auth.uid() = actor_id or auth.uid() = user_id);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
