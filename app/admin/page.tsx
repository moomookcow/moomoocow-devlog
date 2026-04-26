import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import CategoryPanel from "@/components/shared/category-panel";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { getPublishedCommentStats, listRecentPublishedComments } from "@/lib/comments";
import { sharedCategoryGroups } from "@/lib/mock-data";
import { listAdminPosts, listTopPostViews } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin");

  let postsError = false;
  let posts = [] as Awaited<ReturnType<typeof listAdminPosts>>;
  let categoryGroups = sharedCategoryGroups;
  let recentComments = [] as Awaited<ReturnType<typeof listRecentPublishedComments>>;
  let topViewStats = [] as Awaited<ReturnType<typeof listTopPostViews>>;
  let commentStats = {
    total: 0,
    recent7d: 0,
    pendingReply: 0,
  };

  try {
    posts = await listAdminPosts(supabase, 50);
  } catch {
    postsError = true;
  }
  try {
    const categories = await listActiveCategories(supabase, 200);
    const groups = buildCategoryPanelGroups(categories, posts, { hrefBase: "/admin/posts" });
    if (groups.length > 0) {
      categoryGroups = groups;
    }
  } catch {
    categoryGroups = sharedCategoryGroups;
  }
  try {
    recentComments = await listRecentPublishedComments(supabase, 16);
    commentStats = await getPublishedCommentStats(supabase);
  } catch {
    recentComments = [];
    commentStats = { total: 0, recent7d: 0, pendingReply: 0 };
  }
  try {
    topViewStats = await listTopPostViews(supabase, 12);
  } catch {
    topViewStats = [];
  }

  const postById = new Map(posts.map((post) => [post.id, post]));
  const popularPostStats = topViewStats
    .map((item) => {
      const post = postById.get(item.postId);
      if (!post) return null;
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        viewCount: item.viewCount,
      };
    })
    .filter(
      (item): item is { id: string; slug: string; title: string; viewCount: number } => item !== null,
    );
  const recentCommentFeedItems = recentComments
    .map((comment) => {
      const post = postById.get(comment.postId);
      if (!post) return null;
      const preview = comment.content.trim().replace(/\s+/g, " ");
      const short = preview.length > 48 ? `${preview.slice(0, 48)}…` : preview;
      return {
        id: `recent-comment-${comment.id}`,
        label: `${comment.authorName}: ${short}`,
        href: `/posts/${encodeURIComponent(post.slug)}?jump=bottom#page-bottom`,
      };
    })
    .filter((item): item is { id: string; label: string; href: string } => item !== null);

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="korean-display text-balance text-5xl leading-[0.95] sm:text-7xl">Admin Workspace</h1>
        <p className="korean-display mt-3 text-xl text-foreground/90 sm:text-2xl">글 운영, 통계, 워크플로우를 한 화면에서 관리합니다.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="self-start space-y-4">
          <CategoryPanel groups={categoryGroups} />
        </aside>
        <AdminDashboardClient
          posts={posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title,
            summary: post.summary,
            tags: post.tags ?? [],
            status: post.status,
            updatedAt: post.updatedAt,
            thumbnailUrl: post.thumbnailUrl,
          }))}
          postsError={postsError}
          popularPostStats={popularPostStats}
          recentCommentFeedItems={recentCommentFeedItems}
          commentStats={commentStats}
        />
      </div>
    </main>
  );
}
