-- Run this in Supabase SQL Editor
-- Purpose: normalize tags with many-to-many relation (posts <-> tags).

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tags_name on public.tags (name);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create index if not exists idx_post_tags_post_id on public.post_tags (post_id);
create index if not exists idx_post_tags_tag_id on public.post_tags (tag_id);

alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

-- Read policies
drop policy if exists "tags_select_anon" on public.tags;
create policy "tags_select_anon"
on public.tags
for select
to anon
using (true);

drop policy if exists "tags_select_authenticated" on public.tags;
create policy "tags_select_authenticated"
on public.tags
for select
to authenticated
using (true);

drop policy if exists "post_tags_select_anon" on public.post_tags;
create policy "post_tags_select_anon"
on public.post_tags
for select
to anon
using (true);

drop policy if exists "post_tags_select_authenticated" on public.post_tags;
create policy "post_tags_select_authenticated"
on public.post_tags
for select
to authenticated
using (true);

-- Write policies (admin flow uses authenticated session)
drop policy if exists "tags_insert_authenticated" on public.tags;
create policy "tags_insert_authenticated"
on public.tags
for insert
to authenticated
with check (true);

drop policy if exists "tags_update_authenticated" on public.tags;
create policy "tags_update_authenticated"
on public.tags
for update
to authenticated
using (true)
with check (true);

drop policy if exists "tags_delete_authenticated" on public.tags;
create policy "tags_delete_authenticated"
on public.tags
for delete
to authenticated
using (true);

drop policy if exists "post_tags_insert_authenticated" on public.post_tags;
create policy "post_tags_insert_authenticated"
on public.post_tags
for insert
to authenticated
with check (true);

drop policy if exists "post_tags_delete_authenticated" on public.post_tags;
create policy "post_tags_delete_authenticated"
on public.post_tags
for delete
to authenticated
using (true);
