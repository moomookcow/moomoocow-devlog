-- Run this in Supabase SQL Editor when `posts` table already exists
-- Purpose: add missing publish metadata columns without dropping data.

alter table public.posts
  add column if not exists category text,
  add column if not exists visibility text not null default 'public',
  add column if not exists thumbnail_url text;

-- Ensure visibility constraint exists (idempotent style)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_visibility_check'
  ) then
    alter table public.posts
      add constraint posts_visibility_check check (visibility in ('public', 'private'));
  end if;
end
$$;

