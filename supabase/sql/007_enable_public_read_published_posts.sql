-- Run this in Supabase SQL Editor after 001_create_posts_table.sql
-- Purpose: allow anonymous visitors to read only published/public posts.

alter table public.posts enable row level security;

-- Keep full read access for authenticated users (admin/dashboard flow).
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
on public.posts
for select
to authenticated
using (true);

-- Allow public site visitors to read only publicly visible published posts.
drop policy if exists "posts_select_anon_published_public" on public.posts;
create policy "posts_select_anon_published_public"
on public.posts
for select
to anon
using (status = 'published' and visibility = 'public');

