-- Run this in Supabase SQL Editor
-- Purpose: comments + replies MVP for public posts.

create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid null references public.comments(id) on delete cascade,
  author_name text not null,
  author_email text,
  content text not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_post_id on public.comments (post_id);
create index if not exists idx_comments_parent_id on public.comments (parent_id);
create index if not exists idx_comments_created_at on public.comments (created_at asc);

alter table public.comments enable row level security;

-- Read policies
drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated"
on public.comments
for select
to authenticated
using (true);

drop policy if exists "comments_select_anon_published" on public.comments;
create policy "comments_select_anon_published"
on public.comments
for select
to anon
using (status = 'published');

-- Insert policies
drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated"
on public.comments
for insert
to authenticated
with check (true);

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
  and (
    parent_id is null
    or exists (
      select 1
      from public.comments c
      where c.id = parent_id
        and c.post_id = post_id
        and c.status = 'published'
    )
  )
);

-- Admin-side moderation/update/delete support
drop policy if exists "comments_update_authenticated" on public.comments;
create policy "comments_update_authenticated"
on public.comments
for update
to authenticated
using (true)
with check (true);

drop policy if exists "comments_delete_authenticated" on public.comments;
create policy "comments_delete_authenticated"
on public.comments
for delete
to authenticated
using (true);

