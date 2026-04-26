import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import type { createClient } from "@/lib/supabase/server";

type SupabaseQueryClient = {
  from: Awaited<ReturnType<typeof createClient>>["from"];
};

export type PostStatus = "draft" | "published";

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  contentMdx: string;
  tags: string[];
  status: PostStatus;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

type PostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_mdx: string;
  tags: string[] | null;
  status: PostStatus;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
};

function mapPost(row: PostRow): AdminPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    contentMdx: row.content_mdx,
    tags: row.tags ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

export function normalizeTags(raw: string): string[] {
  const seen = new Set<string>();

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag) return false;
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function slugifyTitle(title: string): string {
  const compact = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\uac00-\ud7a3\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (compact) return compact;

  return `post-${Date.now()}`;
}

async function slugExists(supabase: SupabaseQueryClient, slug: string): Promise<boolean> {
  const { data, error } = (await supabase
    .from("posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle()) as PostgrestSingleResponse<{ slug: string }>;

  if (error) {
    throw error;
  }

  return Boolean(data?.slug);
}

async function makeUniqueSlug(supabase: SupabaseQueryClient, baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let index = 2;

  while (await slugExists(supabase, candidate)) {
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }

  return candidate;
}

export async function listAdminPosts(supabase: SupabaseQueryClient, limit = 50): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, summary, content_mdx, tags, status, created_at, updated_at, published_at")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPost(row as PostRow));
}

export async function getPostBySlug(
  supabase: SupabaseQueryClient,
  slug: string,
): Promise<AdminPost | null> {
  const selectFields = "id, slug, title, summary, content_mdx, tags, status, created_at, updated_at, published_at";
  const candidates = (() => {
    const values = [slug];
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded && decoded !== slug) values.push(decoded);
    } catch {
      // keep original slug only
    }
    return values;
  })();

  let data: PostRow | null = null;
  let error: { message?: string } | null = null;

  for (const candidate of candidates) {
    const result = await supabase
      .from("posts")
      .select(selectFields)
      .eq("slug", candidate)
      .maybeSingle();

    if (result.error) {
      error = result.error;
      continue;
    }

    if (result.data) {
      data = result.data as PostRow;
      error = null;
      break;
    }
  }

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapPost(data as PostRow);
}

export async function createPost(
  supabase: SupabaseQueryClient,
  input: {
    title: string;
    summary: string;
    contentMdx: string;
    status: PostStatus;
    tagsRaw: string;
    authorEmail: string | null;
    visibility?: "public" | "private";
    category?: string | null;
    thumbnailUrl?: string | null;
  },
): Promise<{ id: string; slug: string }> {
  const now = new Date().toISOString();
  const baseSlug = slugifyTitle(input.title);
  const slug = await makeUniqueSlug(supabase, baseSlug);

  const payload = {
    slug,
    title: input.title,
    summary: input.summary || null,
    content_mdx: input.contentMdx,
    status: input.status,
    tags: normalizeTags(input.tagsRaw),
    author_email: input.authorEmail,
    updated_at: now,
    published_at: input.status === "published" ? now : null,
  };
  const payloadWithMeta = {
    ...payload,
    category: input.category && input.category !== "none" ? input.category : null,
    visibility: input.visibility ?? "public",
    thumbnail_url: input.thumbnailUrl || null,
  };

  const insertWithPayload = async (insertPayload: typeof payload | typeof payloadWithMeta) => {
    const { data, error } = await supabase
      .from("posts")
      .insert(insertPayload)
      .select("id, slug")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: String(data.id),
      slug: String(data.slug),
    };
  };

  try {
    return await insertWithPayload(payloadWithMeta);
  } catch (error) {
    try {
      return await insertWithPayload(payload);
    } catch {
      throw error;
    }
  }
}
