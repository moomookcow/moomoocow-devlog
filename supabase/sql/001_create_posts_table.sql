-- Run this in Supabase SQL Editor
-- Purpose: create the `public.posts` table required by /admin/new publishing flow.

create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content_mdx text not null,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_email text,
  category text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_posts_updated_at on public.posts (updated_at desc);
create index if not exists idx_posts_published_at on public.posts (published_at desc);

alter table public.posts enable row level security;

-- Temporary MVP policies (tighten later with proper role checks)
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
on public.posts
for select
to authenticated
using (true);

drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated"
on public.posts
for insert
to authenticated
with check (true);

drop policy if exists "posts_update_authenticated" on public.posts;
create policy "posts_update_authenticated"
on public.posts
for update
to authenticated
using (true)
with check (true);

drop policy if exists "posts_delete_authenticated" on public.posts;
create policy "posts_delete_authenticated"
on public.posts
for delete
to authenticated
using (true);
