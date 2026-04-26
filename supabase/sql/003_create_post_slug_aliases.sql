-- Run this in Supabase SQL Editor after 001_create_posts_table.sql
-- Purpose: keep old post URLs alive when slug changes.

create table if not exists public.post_slug_aliases (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  old_slug text not null unique,
  new_slug text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_slug_aliases_post_id on public.post_slug_aliases (post_id);
create index if not exists idx_post_slug_aliases_new_slug on public.post_slug_aliases (new_slug);

alter table public.post_slug_aliases enable row level security;

drop policy if exists "post_slug_aliases_select_authenticated" on public.post_slug_aliases;
create policy "post_slug_aliases_select_authenticated"
on public.post_slug_aliases
for select
to authenticated
using (true);

drop policy if exists "post_slug_aliases_insert_authenticated" on public.post_slug_aliases;
create policy "post_slug_aliases_insert_authenticated"
on public.post_slug_aliases
for insert
to authenticated
with check (true);

drop policy if exists "post_slug_aliases_update_authenticated" on public.post_slug_aliases;
create policy "post_slug_aliases_update_authenticated"
on public.post_slug_aliases
for update
to authenticated
using (true)
with check (true);

drop policy if exists "post_slug_aliases_delete_authenticated" on public.post_slug_aliases;
create policy "post_slug_aliases_delete_authenticated"
on public.post_slug_aliases
for delete
to authenticated
using (true);
