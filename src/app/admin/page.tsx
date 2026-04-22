import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmailAllowed } from "@/lib/admin";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

import { createPostAction } from "./actions";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required_fields: "제목, 요약, 본문은 필수입니다.",
};

const SUCCESS_MESSAGE: Record<string, string> = {
  draft: "임시저장 완료",
  published: "포스트 발행 완료",
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
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

  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? ERROR_MESSAGE[params.error] : null;
  const successMessage = params?.success ? SUCCESS_MESSAGE[params.success] : null;

  const posts = await db.post.findMany({
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
          Admin Workspace
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          포스트 작성
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Velog 스타일 워크플로우의 1차 버전으로, 마크다운 본문을 작성하고
          임시저장 또는 발행할 수 있습니다.
        </p>

        <div className="mt-3 text-xs text-muted-foreground sm:text-sm">
          로그인 계정: {user.email}
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 text-sm text-primary-foreground" role="status" style={{ color: "var(--foreground)" }}>
            {successMessage}
          </p>
        ) : null}

        <form action={createPostAction} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              name="title"
              required
              className="h-11 rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm"
              placeholder="예: Supabase Auth + Prisma로 블로그 어드민 구성하기"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="summary">
              요약
            </label>
            <textarea
              id="summary"
              name="summary"
              required
              rows={3}
              className="rounded-[var(--radius-md)] border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="포스트의 핵심 내용을 2~3문장으로 작성"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="tags">
              태그(콤마로 구분)
            </label>
            <input
              id="tags"
              name="tags"
              className="h-11 rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm"
              placeholder="nextjs, supabase, prisma"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="contentMdx">
              본문 (Markdown)
            </label>
            <textarea
              id="contentMdx"
              name="contentMdx"
              required
              rows={14}
              className="rounded-[var(--radius-md)] border border-input bg-transparent px-3 py-2 text-sm font-mono"
              placeholder="# 제목\n\n여기에 본문 마크다운을 작성하세요."
            />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
              type="submit"
              name="status"
              value="draft"
            >
              임시저장
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
              type="submit"
              name="status"
              value="published"
            >
              발행하기
            </button>
            <a
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-medium transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
              style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
              href="/auth/signout"
            >
              로그아웃
            </a>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
              href="/"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
          최근 포스트
        </h2>

        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">아직 작성된 포스트가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-[var(--radius-md)] border border-border p-4 text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">{post.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {post.status === "published" ? "published" : "draft"} · {post.slug}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{post.summary}</p>
                {post.tags.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    태그: {post.tags.map((entry) => entry.tag.name).join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
