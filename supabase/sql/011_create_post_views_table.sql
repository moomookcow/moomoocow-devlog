-- Run this in Supabase SQL Editor
-- Purpose: store per-post view aggregates and expose a safe increment function.

create table if not exists public.post_views (
  post_id uuid primary key references public.posts(id) on delete cascade,
  view_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_post_views_view_count on public.post_views (view_count desc);
create index if not exists idx_post_views_updated_at on public.post_views (updated_at desc);

alter table public.post_views enable row level security;

drop policy if exists "post_views_select_anon" on public.post_views;
create policy "post_views_select_anon"
on public.post_views
for select
to anon
using (true);

drop policy if exists "post_views_select_authenticated" on public.post_views;
create policy "post_views_select_authenticated"
on public.post_views
for select
to authenticated
using (true);

create or replace function public.increment_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 공개 게시글만 집계한다.
  if not exists (
    select 1
    from public.posts
    where id = p_post_id
      and status = 'published'
      and visibility = 'public'
  ) then
    return;
  end if;

  insert into public.post_views (post_id, view_count, updated_at)
  values (p_post_id, 1, now())
  on conflict (post_id)
  do update
    set view_count = public.post_views.view_count + 1,
        updated_at = now();
end;
$$;

revoke all on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;
