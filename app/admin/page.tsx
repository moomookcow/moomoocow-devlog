import NextImage from "next/image";
import Link from "next/link";

import CategoryPanel from "@/components/shared/category-panel";
import RightFeedPanel from "@/components/shared/right-feed-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { sharedCategoryGroups } from "@/lib/mock-data";
import { listAdminPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const mockPopular = [
  "Next.js App Router에서 인증 흐름 정리",
  "Supabase Auth 실전 트러블슈팅",
  "Velog 스타일 에디터 구현 메모",
  "React Server Components 경계 설계",
  "SSR/CSR 혼합 렌더링에서의 상태 관리",
  "다크모드 토글 UX 체크리스트",
];
const mockRecent = [
  "디자인 토큰을 먼저 고정해야 하는 이유",
  "관리자 대시보드 1차 구조",
  "다크모드 토글 적용 기록",
  "루트 페이지 히어로 재배치",
  "카테고리 접기/펼치기 구조 도입",
  "피드 패널 검색 입력 고정",
];
const mockComments = [
  "로그인 흐름 정리 감사합니다",
  "TOC UI 기대돼요",
  "다음 글도 기다릴게요",
  "카테고리 트리 구조 마음에 듭니다",
  "피드 패널 스크롤 UX 좋아요",
  "히어로 타이틀이 강렬하네요",
];

function formatDate(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

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

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;
  const popularPosts = posts
    .filter((post) => post.status === "published")
    .slice(0, 5)
    .map((post, index) => ({
      rank: index + 1,
      title: post.title,
      slug: post.slug,
      views: "-",
    }));
  const commentStats = {
    total: 0,
    recent7d: 0,
    pendingReply: 0,
  };
  const adminFeedSections = [
    {
      title: "인기 글",
      items: mockPopular.map((label, idx) => ({ id: `popular-${idx}`, label })),
    },
    {
      title: "최근 글",
      items: mockRecent.map((label, idx) => ({ id: `recent-${idx}`, label })),
    },
    {
      title: "최근 댓글",
      items: mockComments.map((label, idx) => ({ id: `comment-${idx}`, label })),
    },
  ];

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

        <section className="space-y-3">
          <Card className="surface-panel rounded-none">
            <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardDescription>Admin Dashboard</CardDescription>
                <CardTitle className="korean-display text-3xl leading-tight sm:text-4xl">글 관리</CardTitle>
                <CardDescription>카테고리 관리, 글 작성, 발행 상태를 중앙에서 제어합니다.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin/categories" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}>
                  카테고리 관리
                </Link>
                <Link href="/admin/new" className={cn(buttonVariants({ variant: "default" }), "h-9 rounded-none px-4")}>
                  새 글 작성
                </Link>
                <Link href="/auth/signout" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}>
                  로그아웃
                </Link>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="surface-subtle rounded-none p-3">
                <p className="text-xs text-muted-foreground">전체 글</p>
                <p className="mt-1 text-2xl font-semibold">{posts.length}</p>
              </div>
              <div className="surface-subtle rounded-none p-3">
                <p className="text-xs text-muted-foreground">발행 글</p>
                <p className="mt-1 text-2xl font-semibold">{publishedCount}</p>
              </div>
              <div className="surface-subtle rounded-none p-3">
                <p className="text-xs text-muted-foreground">임시저장</p>
                <p className="mt-1 text-2xl font-semibold">{draftCount}</p>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Card className="surface-panel rounded-none">
              <CardHeader>
                <CardTitle className="korean-display text-2xl">많이 조회한 글</CardTitle>
                <CardDescription>조회수 테이블 연동 전까지는 발행 글 기준 임시 목록으로 표시됩니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {popularPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">발행 글이 없어 통계를 표시할 수 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {popularPosts.map((item) => (
                      <li key={item.slug} className="surface-subtle rounded-none p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-xs text-muted-foreground">#{String(item.rank).padStart(2, "0")}</p>
                            <Link href={`/admin/posts/${encodeURIComponent(item.slug)}`} className="korean-display line-clamp-1 text-lg hover:opacity-85">
                              {item.title}
                            </Link>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-xs text-muted-foreground">views</p>
                            <p className="font-mono text-sm">{item.views}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="surface-panel rounded-none">
              <CardHeader>
                <CardTitle className="korean-display text-2xl">댓글 인사이트</CardTitle>
                <CardDescription>댓글 시스템 연결 후 실제 수치가 자동 반영됩니다.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="surface-subtle rounded-none p-3">
                  <p className="text-xs text-muted-foreground">전체 댓글</p>
                  <p className="mt-1 text-2xl font-semibold">{commentStats.total}</p>
                </div>
                <div className="surface-subtle rounded-none p-3">
                  <p className="text-xs text-muted-foreground">최근 7일</p>
                  <p className="mt-1 text-2xl font-semibold">{commentStats.recent7d}</p>
                </div>
                <div className="surface-subtle rounded-none p-3">
                  <p className="text-xs text-muted-foreground">답변 필요</p>
                  <p className="mt-1 text-2xl font-semibold">{commentStats.pendingReply}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">블로그 글 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {postsError ? (
                <p className="text-sm text-destructive">
                  posts 조회에 실패했습니다. Supabase 테이블/컬럼(`slug`, `title`, `content_mdx`, `status`) 구성을 확인해주세요.
                </p>
              ) : posts.length === 0 ? (
                <div className="surface-subtle rounded-none p-4 text-sm text-muted-foreground">아직 작성된 글이 없습니다. 첫 글을 작성해보세요.</div>
              ) : (
                <ul className="space-y-2">
                  {posts.map((post) => (
                    <li key={post.id} className="surface-subtle rounded-none p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {post.thumbnailUrl ? (
                            <div className="hidden shrink-0 overflow-hidden rounded-none border border-border/60 sm:block">
                              <NextImage
                                src={post.thumbnailUrl}
                                alt={`${post.title} thumbnail`}
                                width={160}
                                height={90}
                                sizes="160px"
                                className="h-20 w-32 object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0 space-y-1">
                          <Link href={`/admin/posts/${encodeURIComponent(post.slug)}`} className="korean-display block truncate text-xl hover:opacity-85">
                            {post.title}
                          </Link>
                          <p className="truncate font-mono text-xs text-muted-foreground">/{post.slug}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className="rounded-sm px-2.5 py-1 text-sm">
                            {post.status.toUpperCase()}
                          </Badge>
                          <Link
                            href={`/admin/new?slug=${encodeURIComponent(post.slug)}`}
                            className={cn(buttonVariants({ variant: "outline" }), "h-8 rounded-none px-3")}
                          >
                            편집
                          </Link>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="line-clamp-2 font-mono text-sm text-muted-foreground">{post.summary || "소개글이 없습니다."}</p>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{formatDate(post.updatedAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="lg:sticky lg:top-24">
          <RightFeedPanel
            panelTitle="피드 패널"
            searchPlaceholder="검색"
            searchAriaLabel="게시글 검색"
            sections={adminFeedSections}
          />
        </aside>
      </div>
    </main>
  );
}
