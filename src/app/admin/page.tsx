import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmailAllowed } from "@/lib/admin";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?next=/admin");
  }

  if (!isAdminEmailAllowed(user.email)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }

  const [posts, tags] = await Promise.all([
    db.post.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    db.tag.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        posts: true,
      },
    }),
  ]);

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;
  const popularPosts = posts.filter((post) => post.status === "published").slice(0, 5);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
              Admin Dashboard
            </p>
            <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
              블로그 운영 대시보드
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">현재 로그인 계정: {user.email}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
              href="/admin/new"
            >
              새 글 작성
            </Link>
            <a
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-medium transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
              style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
              href="/auth/signout"
            >
              로그아웃
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">전체 글</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{posts.length}</p>
        </article>
        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">발행 글</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{publishedCount}</p>
        </article>
        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">임시저장</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{draftCount}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <h2 className="font-display text-xl text-foreground">카테고리/태그 관리</h2>
          {tags.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">아직 태그가 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {tags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between">
                  <span className="text-foreground">#{tag.name}</span>
                  <span className="text-xs text-muted-foreground">{tag.posts.length} posts</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <h2 className="font-display text-xl text-foreground">인기 글(임시)</h2>
          {popularPosts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">발행된 글이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {popularPosts.map((post) => (
                <li key={post.id} className="text-foreground">{post.title}</li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <h2 className="font-display text-xl text-foreground">최근 글</h2>
          {posts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">아직 작성된 글이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {posts.map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground">{post.title}</span>
                  <span className="text-xs text-muted-foreground">{post.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-[var(--radius-md)] border border-border bg-card p-5">
          <h2 className="font-display text-xl text-foreground">최근 댓글</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            댓글 기능은 아직 구현 전입니다. Phase 확장 시 연결 예정입니다.
          </p>
        </article>
      </section>
    </main>
  );
}
