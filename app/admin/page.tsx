import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import CategoryPanel from "@/components/shared/category-panel";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { sharedCategoryGroups } from "@/lib/mock-data";
import { listAdminPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin");

  let postsError = false;
  let posts = [] as Awaited<ReturnType<typeof listAdminPosts>>;
  let categoryGroups = sharedCategoryGroups;

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
            status: post.status,
            updatedAt: post.updatedAt,
            thumbnailUrl: post.thumbnailUrl,
          }))}
          postsError={postsError}
        />
      </div>
    </main>
  );
}
