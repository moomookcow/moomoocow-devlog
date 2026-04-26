-- Run this in Supabase SQL Editor after 005_create_categories_table.sql
-- Purpose: support hierarchical categories (parent -> child).

alter table public.categories
  add column if not exists parent_id uuid null references public.categories(id) on delete set null;

create index if not exists idx_categories_parent_id on public.categories (parent_id);
