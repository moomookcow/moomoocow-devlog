import type { createClient } from "@/lib/supabase/server";

type SupabaseQueryClient = {
  from: Awaited<ReturnType<typeof createClient>>["from"];
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugifyCategoryName(name: string): string {
  const compact = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\uac00-\ud7a3\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return compact || `category-${Date.now()}`;
}

async function categorySlugExists(supabase: SupabaseQueryClient, slug: string) {
  const { data, error } = await supabase.from("categories").select("slug").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return Boolean(data?.slug);
}

async function makeUniqueCategorySlug(supabase: SupabaseQueryClient, baseSlug: string) {
  let candidate = baseSlug;
  let index = 2;

  while (await categorySlugExists(supabase, candidate)) {
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }

  return candidate;
}

export async function listAdminCategories(supabase: SupabaseQueryClient, limit = 200): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row as CategoryRow));
}

export async function listActiveCategories(supabase: SupabaseQueryClient, limit = 200): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row as CategoryRow));
}

export async function createCategory(
  supabase: SupabaseQueryClient,
  input: { name: string; description?: string | null; isActive?: boolean; parentId?: string | null },
): Promise<Category> {
  const name = input.name.trim();
  const baseSlug = slugifyCategoryName(name);
  const slug = await makeUniqueCategorySlug(supabase, baseSlug);
  const now = new Date().toISOString();
  const all = (await listAdminCategories(supabase, 500)).filter(
    (item) => (item.parentId ?? null) === (input.parentId ?? null),
  );
  const nextSort = all.length > 0 ? Math.max(...all.map((item) => item.sortOrder)) + 1 : 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      description: input.description?.trim() || null,
      parent_id: input.parentId ?? null,
      is_active: input.isActive ?? true,
      sort_order: nextSort,
      updated_at: now,
    })
    .select("id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapCategory(data as CategoryRow);
}

export async function updateCategoryById(
  supabase: SupabaseQueryClient,
  id: string,
  input: { name?: string; description?: string | null; isActive?: boolean; parentId?: string | null },
) {
  const now = new Date().toISOString();
  const payload: {
    name?: string;
    slug?: string;
    description?: string | null;
    parent_id?: string | null;
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: now,
  };

  if (typeof input.description !== "undefined") {
    payload.description = input.description?.trim() || null;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  if (typeof input.parentId !== "undefined") {
    payload.parent_id = input.parentId ?? null;
  }

  if (typeof input.name === "string") {
    const nextName = input.name.trim();
    payload.name = nextName;

    const current = await supabase.from("categories").select("slug").eq("id", id).maybeSingle();
    if (current.error) throw current.error;
    const baseSlug = slugifyCategoryName(nextName);
    const currentSlug = String(current.data?.slug ?? "");
    payload.slug = currentSlug === baseSlug ? currentSlug : await makeUniqueCategorySlug(supabase, baseSlug);
  }

  const { error } = await supabase.from("categories").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCategoryById(supabase: SupabaseQueryClient, id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function moveCategoryById(
  supabase: SupabaseQueryClient,
  id: string,
  direction: "up" | "down",
) {
  const all = await listAdminCategories(supabase, 500);
  const current = all.find((item) => item.id === id);
  if (!current) return;

  const siblings = all.filter((item) => (item.parentId ?? null) === (current.parentId ?? null));
  const currentIndex = siblings.findIndex((item) => item.id === id);
  if (currentIndex < 0) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return;

  const swapped = [...siblings];
  [swapped[currentIndex], swapped[targetIndex]] = [swapped[targetIndex], swapped[currentIndex]];

  const now = new Date().toISOString();
  const updates = swapped.map((item, idx) =>
    supabase
      .from("categories")
      .update({ sort_order: idx + 1, updated_at: now })
      .eq("id", item.id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
