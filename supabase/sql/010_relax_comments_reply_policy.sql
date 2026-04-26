-- Run this in Supabase SQL Editor after 009_create_comments_table.sql
-- Purpose: prevent reply insert failures caused by strict self-referential RLS checks.
-- We already validate parent_id integrity in server action.

drop policy if exists "comments_insert_anon_published_public_post" on public.comments;
create policy "comments_insert_anon_published_public_post"
on public.comments
for insert
to anon
with check (
  status = 'published'
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and p.status = 'published'
      and p.visibility = 'public'
  )
);

