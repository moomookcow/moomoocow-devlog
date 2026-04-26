import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CommentsThread from "@/components/posts/comments-thread";
import AutoScrollBottom from "@/components/posts/auto-scroll-bottom";
import CategoryPanel from "@/components/shared/category-panel";
import ScrollToc from "@/components/shared/scroll-toc";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { listPublishedCommentsByPostId } from "@/lib/comments";
import { sharedCategoryGroups } from "@/lib/mock-data";
import { getPublishedPostBySlug, incrementPostView, listPublishedPosts } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PublicPostPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ comment_error?: string; comment_success?: string; jump?: string }>;
};

const SUPABASE_STORAGE_PUBLIC_PATH = "/storage/v1/object/public/post-thumbnails/";
const COMMENT_ERROR_MESSAGE: Record<string, string> = {
  invalid_author_name: "닉네임은 1~40자로 입력해주세요.",
  invalid_author_email: "이메일 형식이 올바르지 않습니다.",
  invalid_content: "댓글 내용을 1~2000자로 입력해주세요.",
  invalid_parent: "답글 대상을 찾을 수 없습니다.",
  reply_depth_exceeded: "MVP에서는 댓글의 답글(1단계)까지만 허용됩니다.",
  save_failed: "댓글 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
  post_not_found: "게시글을 찾을 수 없습니다.",
};

function isSupabaseStorageImage(url: string) {
  return url.includes(SUPABASE_STORAGE_PUBLIC_PATH);
}

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+={}\[\]|\\:;"'<>,.?/]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readNodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(readNodeText).join(" ");
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return readNodeText(props?.children);
  }
  return "";
}

function estimateReadMinutes(content: string) {
  const words = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

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

function MarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (!src || typeof src !== "string") return null;

  if (isSupabaseStorageImage(src)) {
    return (
      <span className="my-5 block w-full overflow-hidden rounded-none">
        <NextImage
          src={src}
          alt={alt ?? "markdown image"}
          width={1600}
          height={900}
          sizes="(max-width: 1024px) 100vw, 70vw"
          className="h-auto w-full object-contain"
        />
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? "markdown image"} loading="lazy" decoding="async" />;
}

function createHeadingRenderer(tag: "h1" | "h2" | "h3", fallbackIdPrefix: string) {
  return { tag, fallbackIdPrefix };
}

function createHeadingRenderers() {
  const used = new Map<string, number>();
  const make = ({ tag, fallbackIdPrefix }: { tag: "h1" | "h2" | "h3"; fallbackIdPrefix: string }) => {
    return function HeadingRenderer({ children }: { children?: ReactNode }) {
      const text = readNodeText(children).trim();
      const base = slugifyHeading(text) || fallbackIdPrefix;
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      if (tag === "h1") return <h1 id={id}>{children}</h1>;
      if (tag === "h2") return <h2 id={id}>{children}</h2>;
      return <h3 id={id}>{children}</h3>;
    };
  };

  return {
    h1: make(createHeadingRenderer("h1", "h1")),
    h2: make(createHeadingRenderer("h2", "h2")),
    h3: make(createHeadingRenderer("h3", "h3")),
  };
}

export default async function PublicPostDetailPage({ params, searchParams }: PublicPostPageProps) {
  const supabase = createPublicClient();
  const { slug } = await params;
  const search = searchParams ? await searchParams : undefined;
  const commentError = search?.comment_error ? COMMENT_ERROR_MESSAGE[search.comment_error] : null;
  const commentSuccess = search?.comment_success === "1";
  const shouldJumpToBottom = search?.jump === "bottom";

  const post = await getPublishedPostBySlug(supabase, slug);
  if (!post) notFound();
  try {
    await incrementPostView(supabase, post.id);
  } catch {
    // no-op: 조회수 집계 실패가 본문 렌더를 막지 않도록 한다.
  }

  const publishedPosts = await listPublishedPosts(supabase, 200);
  const comments = await listPublishedCommentsByPostId(supabase, post.id);
  let categoryGroups = sharedCategoryGroups;
  try {
    const categories = await listActiveCategories(supabase, 200);
    const groups = buildCategoryPanelGroups(categories, publishedPosts, { hrefBase: "/posts" });
    if (groups.length > 0) {
      categoryGroups = groups;
    }
  } catch {
    categoryGroups = sharedCategoryGroups;
  }
  const currentIndex = publishedPosts.findIndex((item) => item.slug === post.slug);
  const nextPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;
  const prevPost =
    currentIndex >= 0 && currentIndex < publishedPosts.length - 1
      ? publishedPosts[currentIndex + 1]
      : null;
  const sameCategoryPosts = post.category
    ? publishedPosts.filter((item) => item.category === post.category).slice(0, 16)
    : [];
  const readingMinutes = estimateReadMinutes(post.contentMdx);
  const headingRenderers = createHeadingRenderers();

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <AutoScrollBottom enabled={shouldJumpToBottom} />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="self-start space-y-4">
          <CategoryPanel groups={categoryGroups} />
        </aside>

        <article className="space-y-3">
          <Card className="surface-panel rounded-none">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{formatDate(post.publishedAt || post.updatedAt)}</span>
                <span>•</span>
                <span className="font-mono">{readingMinutes} min read</span>
                <span>•</span>
                <span className="font-mono">/{post.slug}</span>
              </div>
              <CardTitle className="korean-display text-4xl leading-tight sm:text-5xl">{post.title}</CardTitle>
              <p className="korean-display text-lg text-foreground/85">{post.summary || "소개글이 없습니다."}</p>
              <div className="flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-sm px-2.5 py-1 text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}>
                  홈으로
                </Link>
                <Link
                  href={`/admin/posts/${encodeURIComponent(post.slug)}`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}
                >
                  관리자 상세
                </Link>
              </div>
            </CardHeader>
            {post.thumbnailUrl ? (
              <CardContent className="pt-0">
                <div className="overflow-hidden rounded-none border border-border/60">
                  <NextImage
                    src={post.thumbnailUrl}
                    alt={`${post.title} thumbnail`}
                    width={1600}
                    height={900}
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">
                같은 카테고리 글
                {post.category ? ` · ${post.category}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sameCategoryPosts.length === 0 ? (
                <p className="korean-display text-sm text-muted-foreground">같은 카테고리 글이 아직 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {sameCategoryPosts.map((item) => {
                    const isCurrent = item.slug === post.slug;
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/posts/${encodeURIComponent(item.slug)}`}
                          aria-current={isCurrent ? "page" : undefined}
                          className={cn(
                            "korean-display block rounded-none px-2 py-1 transition-opacity",
                            isCurrent
                              ? "font-bold text-foreground"
                              : "text-muted-foreground hover:opacity-85",
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="surface-panel rounded-none">
            <CardContent id="public-post-content" className="markdown-preview p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
                  h1: headingRenderers.h1,
                  h2: headingRenderers.h2,
                  h3: headingRenderers.h3,
                }}
              >
                {post.contentMdx}
              </ReactMarkdown>
            </CardContent>
          </Card>

          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">이전/다음 포스트</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Link
                href={prevPost ? `/posts/${encodeURIComponent(prevPost.slug)}` : "#"}
                aria-disabled={!prevPost}
                className="surface-subtle block rounded-none p-3 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <p className="font-mono text-xs text-muted-foreground">PREV</p>
                <p className="korean-display mt-1 line-clamp-2 text-lg">{prevPost?.title ?? "이전 포스트 없음"}</p>
              </Link>
              <Link
                href={nextPost ? `/posts/${encodeURIComponent(nextPost.slug)}` : "#"}
                aria-disabled={!nextPost}
                className="surface-subtle block rounded-none p-3 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <p className="font-mono text-xs text-muted-foreground">NEXT</p>
                <p className="korean-display mt-1 line-clamp-2 text-lg">{nextPost?.title ?? "다음 포스트 없음"}</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">댓글 남기기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <CommentsThread
                slug={post.slug}
                comments={comments}
                commentError={commentError ?? null}
                commentSuccess={commentSuccess}
              />
            </CardContent>
          </Card>
        </article>

        <aside className="self-start lg:sticky lg:top-4">
          <Card className="surface-panel rounded-none">
            <CardContent className="max-h-[calc(100dvh-6rem)] overflow-auto pr-2 pt-0">
              <ScrollToc contentSelector="#public-post-content" />
            </CardContent>
          </Card>
        </aside>
      </div>
      <div id="page-bottom" className="h-px w-full" aria-hidden="true" />
    </main>
  );
}
