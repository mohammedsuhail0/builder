insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict (id) do nothing;

drop policy if exists "post-images upload own" on storage.objects;
create policy "post-images upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and split_part(name, '/', 1) = 'posts'
);

drop policy if exists "post-images read own-scope" on storage.objects;
create policy "post-images read own-scope"
on storage.objects
for select
to authenticated
using (bucket_id = 'post-images');

