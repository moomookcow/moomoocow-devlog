-- Run this in Supabase SQL Editor after 005_create_categories_table.sql
-- Purpose: allow anonymous visitors to read active categories for public pages.

alter table public.categories enable row level security;

-- Keep full read access for authenticated users (admin flow).
drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated"
on public.categories
for select
to authenticated
using (true);

-- Allow public site visitors to read only active categories.
drop policy if exists "categories_select_anon_active" on public.categories;
create policy "categories_select_anon_active"
on public.categories
for select
to anon
using (is_active = true);

