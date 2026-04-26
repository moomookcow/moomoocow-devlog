import Link from "next/link";
import { notFound } from "next/navigation";

import HomeFeedClient from "@/components/home/home-feed-client";
import CategoryPanel from "@/components/shared/category-panel";
import { buttonVariants } from "@/components/ui/button";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { listRecentPublishedComments } from "@/lib/comments";
import { listPublishedPosts, listTopPostViews } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";
import { getTagLabelBySlug, listPublishedPostsByTagSlug } from "@/lib/tags";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; tag?: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const rawParams = searchParams ? await searchParams : undefined;
  const queryRaw = (rawParams?.q ?? "").trim();
  const selectedTagSlug = (rawParams?.tag ?? "").trim();

  const supabase = createPublicClient();
  const taggedPosts = await listPublishedPostsByTagSlug(supabase, slug, 200);
  if (taggedPosts.length === 0) {
    notFound();
  }

  const [tagLabel, allPublishedPosts, categories, topViews, recentComments] = await Promise.all([
    getTagLabelBySlug(supabase, slug),
    listPublishedPosts(supabase, 300),
    listActiveCategories(supabase, 200).catch(() => []),
    listTopPostViews(supabase, 20).catch(() => []),
    listRecentPublishedComments(supabase, 24).catch(() => []),
  ]);

  const categoryGroups = buildCategoryPanelGroups(categories, allPublishedPosts, { hrefBase: "/posts" });
  const postById = new Map(taggedPosts.map((post) => [post.id, post]));

  const recentCommentFeedItems = recentComments
    .map((comment) => {
      const post = postById.get(comment.postId);
      if (!post) return null;
      const preview = comment.content.trim().replace(/\s+/g, " ");
      const short = preview.length > 48 ? `${preview.slice(0, 48)}…` : preview;
      return {
        id: `tag-recent-comment-${comment.id}`,
        label: `${comment.authorName}: ${short}`,
        href: `/posts/${encodeURIComponent(post.slug)}?jump=bottom#page-bottom`,
      };
    })
    .filter((item): item is { id: string; label: string; href: string } => item !== null);

  const popularFeedItems = topViews
    .map((item) => {
      const post = postById.get(item.postId);
      if (!post) return null;
      return {
        id: `tag-popular-${post.id}`,
        label: `${post.title} · ${item.viewCount}`,
        href: `/posts/${encodeURIComponent(post.slug)}`,
      };
    })
    .filter((item): item is { id: string; label: string; href: string } => item !== null);

  const allVisiblePosts = taggedPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    summary: post.summary ?? "",
    category: post.category ?? "uncategorized",
    date: formatDate(post.publishedAt || post.updatedAt),
    thumbnailUrl: post.thumbnailUrl,
    tags: post.tags ?? [],
  }));

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="korean-display text-balance text-5xl leading-[0.95] sm:text-7xl">
              #{tagLabel}
            </h1>
            <p className="korean-display mt-3 text-xl text-foreground/90 sm:text-2xl">
              태그로 묶인 글을 모아봅니다.
            </p>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-none px-4")}
          >
            홈으로
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="self-start space-y-4">
          <CategoryPanel groups={categoryGroups} />
        </aside>
        <HomeFeedClient
          posts={allVisiblePosts}
          popularFeedItems={popularFeedItems}
          recentCommentFeedItems={recentCommentFeedItems}
          initialQuery={queryRaw}
          initialTagSlug={selectedTagSlug}
          initialTagName={tagLabel}
        />
      </div>
    </div>
  );
}
