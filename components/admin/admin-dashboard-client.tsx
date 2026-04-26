"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import RightFeedPanel from "@/components/shared/right-feed-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminPostCard = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: "draft" | "published";
  updatedAt: string | null;
  thumbnailUrl: string | null;
};

type AdminDashboardClientProps = {
  posts: AdminPostCard[];
  postsError: boolean;
};

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

export default function AdminDashboardClient({ posts, postsError }: AdminDashboardClientProps) {
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => [post.title, post.summary ?? "", post.slug, post.status].join(" ").toLowerCase().includes(q));
  }, [posts, query]);

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

  const popularFeedItems = posts
    .filter((post) => post.status === "published")
    .slice(0, 12)
    .map((post) => ({
      id: `popular-${post.id}`,
      label: post.title,
      href: `/admin/posts/${encodeURIComponent(post.slug)}`,
    }));
  const recentFeedItems = posts.slice(0, 12).map((post) => ({
    id: `recent-${post.id}`,
    label: post.title,
    href: `/admin/posts/${encodeURIComponent(post.slug)}`,
  }));
  const adminFeedSections = [
    {
      title: "인기 글",
      items:
        popularFeedItems.length > 0
          ? popularFeedItems
          : [{ id: "popular-empty", label: "발행 글이 아직 없습니다." }],
    },
    {
      title: "최근 글",
      items:
        recentFeedItems.length > 0
          ? recentFeedItems
          : [{ id: "recent-empty", label: "작성된 글이 아직 없습니다." }],
    },
    {
      title: "최근 댓글",
      items: [
        {
          id: "comment-pending",
          label: "댓글 시스템 연결 전입니다. 다음 단계에서 실데이터가 표시됩니다.",
        },
      ],
    },
  ];

  return (
    <>
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
            {query.trim() ? (
              <CardDescription>
                {`검색어 "${query}" · ${filteredPosts.length}개`}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {postsError ? (
              <p className="text-sm text-destructive">
                posts 조회에 실패했습니다. Supabase 테이블/컬럼(`slug`, `title`, `content_mdx`, `status`) 구성을 확인해주세요.
              </p>
            ) : filteredPosts.length === 0 ? (
              <div className="surface-subtle rounded-none p-4 text-sm text-muted-foreground">
                {posts.length === 0 ? "아직 작성된 글이 없습니다. 첫 글을 작성해보세요." : "검색 조건에 맞는 글이 없습니다."}
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredPosts.map((post) => (
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
                        <Link href={`/admin/new?slug=${encodeURIComponent(post.slug)}`} className={cn(buttonVariants({ variant: "outline" }), "h-8 rounded-none px-3")}>
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
          searchPlaceholder="어드민 글 검색"
          searchAriaLabel="어드민 게시글 검색"
          searchName="q"
          searchValue={query}
          onSearchChange={setQuery}
          sections={adminFeedSections}
        />
      </aside>
    </>
  );
}
