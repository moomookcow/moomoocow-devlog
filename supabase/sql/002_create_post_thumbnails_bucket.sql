-- Run this in Supabase SQL Editor after 001_create_posts_table.sql
-- Purpose: enable thumbnail upload for publishing dialog.

insert into storage.buckets (id, name, public)
values ('post-thumbnails', 'post-thumbnails', true)
on conflict (id) do nothing;

-- Authenticated users can upload/update/delete files in this bucket.
drop policy if exists "post_thumbnails_insert_authenticated" on storage.objects;
create policy "post_thumbnails_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'post-thumbnails');

drop policy if exists "post_thumbnails_update_authenticated" on storage.objects;
create policy "post_thumbnails_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'post-thumbnails')
with check (bucket_id = 'post-thumbnails');

drop policy if exists "post_thumbnails_delete_authenticated" on storage.objects;
create policy "post_thumbnails_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'post-thumbnails');

-- Public read (because we save/get public URL)
drop policy if exists "post_thumbnails_select_public" on storage.objects;
create policy "post_thumbnails_select_public"
on storage.objects
for select
to public
using (bucket_id = 'post-thumbnails');
