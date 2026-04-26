import HomeFeedClient from "@/components/home/home-feed-client";
import CategoryPanel from "@/components/shared/category-panel";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { listPublishedPosts } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";
type HomePageProps = {
  searchParams?: Promise<{ q?: string; category?: string }>;
};

export const dynamic = "force-dynamic";

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const queryRaw = (params?.q ?? "").trim();
  const selectedCategorySlug = (params?.category ?? "").trim();

  const supabase = createPublicClient();
  let publishedPosts = [] as Awaited<ReturnType<typeof listPublishedPosts>>;
  let categoryGroups = [] as ReturnType<typeof buildCategoryPanelGroups>;
  let activeCategoryName = "";

  try {
    publishedPosts = await listPublishedPosts(supabase, 200);
  } catch {
    publishedPosts = [];
  }
  try {
    const categories = await listActiveCategories(supabase, 200);
    if (selectedCategorySlug) {
      const found = categories.find((item) => item.slug === selectedCategorySlug);
      activeCategoryName = found?.name ?? "";
    }
    const groups = buildCategoryPanelGroups(categories, publishedPosts, { hrefBase: "/posts" });
    categoryGroups = groups;
  } catch {
    categoryGroups = [];
  }

  const allVisiblePosts = publishedPosts.map((post) => ({
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
        <h1 className="korean-display text-balance text-5xl leading-[0.95] sm:text-7xl">
          MooMooCow Devlog
        </h1>
        <p className="korean-display mt-3 text-xl text-foreground/90 sm:text-2xl">
          실전 개발 과정과 트러블슈팅을 기록하는 개인 개발 로그
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="self-start space-y-4">
          <CategoryPanel groups={categoryGroups} />
        </aside>
        <HomeFeedClient
          posts={allVisiblePosts}
          initialQuery={queryRaw}
          initialCategorySlug={selectedCategorySlug}
          initialCategoryName={activeCategoryName}
        />
      </div>
    </div>
  );
}
