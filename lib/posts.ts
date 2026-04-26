import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import type { createClient } from "@/lib/supabase/server";

type SupabaseQueryClient = {
  from: Awaited<ReturnType<typeof createClient>>["from"];
  rpc: Awaited<ReturnType<typeof createClient>>["rpc"];
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
  authorEmail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  category: string | null;
  visibility: "public" | "private";
  thumbnailUrl: string | null;
};

export type PostViewStat = {
  postId: string;
  viewCount: number;
};

type PostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_mdx: string;
  tags: string[] | null;
  status: PostStatus;
  author_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  category: string | null;
  visibility: "public" | "private" | null;
  thumbnail_url: string | null;
};

function slugCandidates(slug: string) {
  const values = [slug];
  try {
    const decoded = decodeURIComponent(slug);
    if (decoded && decoded !== slug) values.push(decoded);
  } catch {
    // keep original slug only
  }
  return values;
}

function mapPost(row: PostRow): AdminPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    contentMdx: row.content_mdx,
    tags: row.tags ?? [],
    status: row.status,
    authorEmail: row.author_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    category: row.category,
    visibility: row.visibility ?? "public",
    thumbnailUrl: row.thumbnail_url,
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

export function normalizeSlugInput(value: string): string {
  const compact = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\uac00-\ud7a3\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return compact;
}

function isMissingAliasTableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "PGRST205" || code === "42P01";
}

function isMissingTagTablesError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "PGRST205" || code === "42P01";
}

function normalizeTagSlug(tag: string): string {
  return normalizeSlugInput(tag);
}

async function syncPostTagRelations(
  supabase: SupabaseQueryClient,
  postId: string,
  tags: string[],
): Promise<void> {
  const unique = new Set<string>();
  const normalized = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    })
    .map((name) => ({ name, slug: normalizeTagSlug(name) }))
    .filter((item) => item.slug.length > 0);

  const clearExistingRelations = async () => {
    const clearResult = await supabase.from("post_tags").delete().eq("post_id", postId);
    if (clearResult.error && !isMissingTagTablesError(clearResult.error)) {
      throw clearResult.error;
    }
  };

  if (normalized.length === 0) {
    await clearExistingRelations();
    return;
  }

  const now = new Date().toISOString();
  const upsertTagsResult = await supabase.from("tags").upsert(
    normalized.map((item) => ({
      slug: item.slug,
      name: item.name,
      updated_at: now,
    })),
    { onConflict: "slug" },
  );
  if (upsertTagsResult.error) {
    if (isMissingTagTablesError(upsertTagsResult.error)) return;
    throw upsertTagsResult.error;
  }

  const fetchTagsResult = await supabase
    .from("tags")
    .select("id, slug")
    .in(
      "slug",
      normalized.map((item) => item.slug),
    );

  if (fetchTagsResult.error) {
    if (isMissingTagTablesError(fetchTagsResult.error)) return;
    throw fetchTagsResult.error;
  }

  const tagIds = (fetchTagsResult.data ?? [])
    .map((row) => String((row as { id: string }).id))
    .filter(Boolean);

  await clearExistingRelations();
  if (tagIds.length === 0) return;

  const insertRelationsResult = await supabase.from("post_tags").insert(
    tagIds.map((tagId) => ({
      post_id: postId,
      tag_id: tagId,
    })),
  );

  if (insertRelationsResult.error && !isMissingTagTablesError(insertRelationsResult.error)) {
    throw insertRelationsResult.error;
  }
}

async function aliasExists(supabase: SupabaseQueryClient, oldSlug: string): Promise<boolean> {
  const result = await supabase
    .from("post_slug_aliases")
    .select("old_slug")
    .eq("old_slug", oldSlug)
    .maybeSingle();

  if (result.error) {
    if (isMissingAliasTableError(result.error)) {
      return false;
    }
    throw result.error;
  }

  return Boolean(result.data?.old_slug);
}

async function isSlugTaken(supabase: SupabaseQueryClient, slug: string): Promise<boolean> {
  return (await slugExists(supabase, slug)) || (await aliasExists(supabase, slug));
}

async function makeUniqueSlugConsideringAliases(
  supabase: SupabaseQueryClient,
  baseSlug: string,
): Promise<string> {
  let candidate = baseSlug;
  let index = 2;

  while (await isSlugTaken(supabase, candidate)) {
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }

  return candidate;
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
    .select("id, slug, title, summary, content_mdx, tags, status, author_email, created_at, updated_at, published_at, category, visibility, thumbnail_url")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPost(row as PostRow));
}

export async function listPublishedPosts(supabase: SupabaseQueryClient, limit = 50): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, summary, content_mdx, tags, status, author_email, created_at, updated_at, published_at, category, visibility, thumbnail_url")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapPost(row as PostRow));
}

export async function listTopPostViews(
  supabase: SupabaseQueryClient,
  limit = 12,
): Promise<PostViewStat[]> {
  const { data, error } = await supabase
    .from("post_views")
    .select("post_id, view_count")
    .order("view_count", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const current = row as { post_id: string; view_count: number | null };
    return {
      postId: current.post_id,
      viewCount: Number(current.view_count ?? 0),
    };
  });
}

export async function incrementPostView(
  supabase: SupabaseQueryClient,
  postId: string,
): Promise<void> {
  const { error } = await supabase.rpc("increment_post_view", { p_post_id: postId });
  if (error) {
    throw error;
  }
}

export async function getPostBySlug(
  supabase: SupabaseQueryClient,
  slug: string,
): Promise<AdminPost | null> {
  const selectFields = "id, slug, title, summary, content_mdx, tags, status, author_email, created_at, updated_at, published_at, category, visibility, thumbnail_url";
  const candidates = slugCandidates(slug);

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

  if (!data) {
    for (const candidate of candidates) {
      const visited = new Set<string>();
      let current = candidate;

      for (let depth = 0; depth < 10; depth += 1) {
        if (visited.has(current)) break;
        visited.add(current);

        const aliasResult = await supabase
          .from("post_slug_aliases")
          .select("new_slug")
          .eq("old_slug", current)
          .maybeSingle();

        if (aliasResult.error) {
          if (isMissingAliasTableError(aliasResult.error)) {
            break;
          }
          throw aliasResult.error;
        }

        const redirectedSlug = aliasResult.data?.new_slug;
        if (!redirectedSlug) break;

        const redirected = await supabase
          .from("posts")
          .select(selectFields)
          .eq("slug", redirectedSlug)
          .maybeSingle();

        if (redirected.error) throw redirected.error;
        if (redirected.data) {
          data = redirected.data as PostRow;
          break;
        }

        current = redirectedSlug;
      }

      if (data) break;
    }
  }

  if (!data) return null;
  return mapPost(data as PostRow);
}

export async function getPublishedPostBySlug(
  supabase: SupabaseQueryClient,
  slug: string,
): Promise<AdminPost | null> {
  const post = await getPostBySlug(supabase, slug);
  if (!post) return null;
  if (post.status !== "published") return null;
  if (post.visibility !== "public") return null;
  return post;
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
    preferredSlug?: string | null;
  },
): Promise<{ id: string; slug: string }> {
  const now = new Date().toISOString();
  const preferred = normalizeSlugInput(input.preferredSlug ?? "");
  const baseSlug = preferred || slugifyTitle(input.title);
  const slug = await makeUniqueSlugConsideringAliases(supabase, baseSlug);
  const normalizedTags = normalizeTags(input.tagsRaw);

  const payload = {
    slug,
    title: input.title,
    summary: input.summary || null,
    content_mdx: input.contentMdx,
    status: input.status,
    tags: normalizedTags,
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

  let created: { id: string; slug: string };
  try {
    created = await insertWithPayload(payloadWithMeta);
  } catch (error) {
    try {
      created = await insertWithPayload(payload);
    } catch {
      throw error;
    }
  }

  await syncPostTagRelations(supabase, created.id, normalizedTags);
  return created;
}

export async function updatePostBySlug(
  supabase: SupabaseQueryClient,
  slug: string,
  input: {
    title: string;
    summary: string;
    contentMdx: string;
    status: PostStatus;
    tagsRaw: string;
    visibility?: "public" | "private";
    category?: string | null;
    thumbnailUrl?: string | null;
    preferredSlug?: string | null;
  },
): Promise<{ id: string; slug: string }> {
  const now = new Date().toISOString();
  const candidates = slugCandidates(slug);
  let currentPost: { id: string; slug: string } | null = null;

  for (const candidate of candidates) {
    const result = await supabase
      .from("posts")
      .select("id, slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (result.data?.id && result.data?.slug) {
      currentPost = {
        id: String(result.data.id),
        slug: String(result.data.slug),
      };
      break;
    }
  }

  if (!currentPost) {
    throw new Error("POST_NOT_FOUND");
  }

  const preferred = normalizeSlugInput(input.preferredSlug ?? "");
  const desiredBaseSlug = preferred || currentPost.slug;
  const normalizedTags = normalizeTags(input.tagsRaw);
  const finalSlug =
    desiredBaseSlug === currentPost.slug
      ? currentPost.slug
      : await makeUniqueSlugConsideringAliases(supabase, desiredBaseSlug);

  const payload = {
    slug: finalSlug,
    title: input.title,
    summary: input.summary || null,
    content_mdx: input.contentMdx,
    status: input.status,
    tags: normalizedTags,
    updated_at: now,
    published_at: input.status === "published" ? now : null,
  };
  const payloadWithMeta = {
    ...payload,
    category: input.category && input.category !== "none" ? input.category : null,
    visibility: input.visibility ?? "public",
    thumbnail_url: input.thumbnailUrl || null,
  };

  const updateWithPayload = async (updatePayload: typeof payload | typeof payloadWithMeta) => {
    const { data, error } = await supabase
      .from("posts")
      .update(updatePayload)
      .eq("id", currentPost.id)
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

  let updated: { id: string; slug: string };
  try {
    updated = await updateWithPayload(payloadWithMeta);
  } catch (error) {
    try {
      updated = await updateWithPayload(payload);
    } catch {
      throw error;
    }
  }

  if (currentPost.slug !== updated.slug) {
    const aliasResult = await supabase.from("post_slug_aliases").upsert(
      {
        post_id: updated.id,
        old_slug: currentPost.slug,
        new_slug: updated.slug,
        created_at: now,
      },
      { onConflict: "old_slug" },
    );

    if (aliasResult.error && !isMissingAliasTableError(aliasResult.error)) {
      throw aliasResult.error;
    }
  }

  await syncPostTagRelations(supabase, updated.id, normalizedTags);

  return updated;
}
