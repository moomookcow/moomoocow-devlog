import type { createClient } from "@/lib/supabase/server";
import { listPublishedPosts, normalizeSlugInput, type AdminPost } from "@/lib/posts";

type SupabaseQueryClient = {
  from: Awaited<ReturnType<typeof createClient>>["from"];
  rpc: Awaited<ReturnType<typeof createClient>>["rpc"];
};

function isMissingTagTablesError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "PGRST205" || code === "42P01";
}

function fallbackTitleFromSlug(slug: string) {
  return slug.replace(/-/g, " ");
}

function filterPostsByTagSlug(posts: AdminPost[], tagSlug: string): AdminPost[] {
  const target = tagSlug.trim().toLowerCase();
  if (!target) return [];
  return posts.filter((post) =>
    (post.tags ?? []).some((tag) => normalizeSlugInput(tag).toLowerCase() === target),
  );
}

export async function getTagLabelBySlug(
  supabase: SupabaseQueryClient,
  tagSlug: string,
): Promise<string> {
  const normalized = normalizeSlugInput(tagSlug);
  if (!normalized) return fallbackTitleFromSlug(tagSlug);

  const tagResult = await supabase
    .from("tags")
    .select("name")
    .eq("slug", normalized)
    .maybeSingle();

  if (tagResult.error) {
    if (isMissingTagTablesError(tagResult.error)) {
      const posts = await listPublishedPosts(supabase, 300);
      const matched = filterPostsByTagSlug(posts, normalized);
      const firstTag = matched
        .flatMap((post) => post.tags ?? [])
        .find((tag) => normalizeSlugInput(tag).toLowerCase() === normalized.toLowerCase());
      return firstTag ?? fallbackTitleFromSlug(normalized);
    }
    throw tagResult.error;
  }

  return tagResult.data?.name ?? fallbackTitleFromSlug(normalized);
}

export async function listPublishedPostsByTagSlug(
  supabase: SupabaseQueryClient,
  tagSlug: string,
  limit = 200,
): Promise<AdminPost[]> {
  const normalized = normalizeSlugInput(tagSlug);
  if (!normalized) return [];

  const tagResult = await supabase
    .from("tags")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();

  if (tagResult.error) {
    if (isMissingTagTablesError(tagResult.error)) {
      const allPublished = await listPublishedPosts(supabase, limit * 2);
      return filterPostsByTagSlug(allPublished, normalized).slice(0, limit);
    }
    throw tagResult.error;
  }

  const tagId = tagResult.data?.id ? String(tagResult.data.id) : null;
  if (!tagId) return [];

  const postTagResult = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tagId);

  if (postTagResult.error) {
    if (isMissingTagTablesError(postTagResult.error)) {
      const allPublished = await listPublishedPosts(supabase, limit * 2);
      return filterPostsByTagSlug(allPublished, normalized).slice(0, limit);
    }
    throw postTagResult.error;
  }

  const postIds = (postTagResult.data ?? [])
    .map((row) => String((row as { post_id: string }).post_id))
    .filter(Boolean);
  if (postIds.length === 0) return [];

  const postsResult = await supabase
    .from("posts")
    .select("id, slug, title, summary, content_mdx, tags, status, created_at, updated_at, published_at, category, visibility, thumbnail_url")
    .in("id", postIds)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (postsResult.error) {
    throw postsResult.error;
  }

  return (postsResult.data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    slug: String((row as { slug: string }).slug),
    title: String((row as { title: string }).title),
    summary: ((row as { summary: string | null }).summary ?? null),
    contentMdx: String((row as { content_mdx: string }).content_mdx),
    tags: (((row as { tags: string[] | null }).tags) ?? []),
    status: "published" as const,
    createdAt: ((row as { created_at: string | null }).created_at ?? null),
    updatedAt: ((row as { updated_at: string | null }).updated_at ?? null),
    publishedAt: ((row as { published_at: string | null }).published_at ?? null),
    category: ((row as { category: string | null }).category ?? null),
    visibility: ((row as { visibility: "public" | "private" | null }).visibility ?? "public"),
    thumbnailUrl: ((row as { thumbnail_url: string | null }).thumbnail_url ?? null),
  }));
}
