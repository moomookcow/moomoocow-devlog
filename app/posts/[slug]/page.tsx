import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import AutoScrollBottom from "@/components/posts/auto-scroll-bottom";
import PublicCommentsCard from "@/components/posts/public-comments-card";
import PostSidebarClient from "@/components/posts/post-sidebar-client";
import RelatedPostsClient from "@/components/posts/related-posts-client";
import ScrollProgressBar from "@/components/shared/scroll-progress-bar";
import ScrollToc from "@/components/shared/scroll-toc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedPostBySlug, incrementPostView, normalizeSlugInput } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 120;

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

const getPublishedPostBySlugCached = unstable_cache(async (slug: string) => {
  const supabase = createPublicClient();
  return getPublishedPostBySlug(supabase, slug);
}, ["public-post-by-slug"], { revalidate });

export async function generateMetadata({ params }: Pick<PublicPostPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlugCached(slug);
  const canonical = `/posts/${encodeURIComponent(slug)}`;

  if (!post) {
    return {
      title: "게시글",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const description = (post.summary ?? "").trim() || `${post.title} 게시글`;
  const image = post.thumbnailUrl || "/default-thumbnail.svg";

  return {
    title: post.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: canonical,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      tags: post.tags ?? [],
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

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

function formatAuthorName(value: string | null) {
  if (!value) return "moomoocow";
  const local = value.split("@")[0]?.trim();
  return local || "moomoocow";
}

function MarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (!src || typeof src !== "string") return null;

  if (isSupabaseStorageImage(src)) {
    return (
      <span className="my-5 block w-full overflow-hidden rounded-none">
        <NextImage
          src={src}
          alt={alt ?? "markdown image"}
          width={1280}
          height={720}
          sizes="(max-width: 768px) 92vw, (max-width: 1280px) 78vw, 960px"
          quality={50}
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

  const post = await getPublishedPostBySlugCached(slug);
  if (!post) notFound();
  void incrementPostView(supabase, post.id).catch(() => {
    // no-op: 조회수 집계 실패가 본문 렌더를 막지 않도록 한다.
  });

  const readingMinutes = estimateReadMinutes(post.contentMdx);
  const authorName = formatAuthorName(post.authorEmail);
  const headingRenderers = createHeadingRenderers();

  return (
    <main className="relative mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
      <AutoScrollBottom enabled={shouldJumpToBottom} />
      <ScrollProgressBar className="pointer-events-none fixed top-0 left-0 z-30 h-1 w-full" />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="order-3 self-start space-y-4 lg:order-1 lg:sticky lg:top-4">
          <PostSidebarClient slug={post.slug} />
        </aside>

        <article className="order-2 min-w-0 space-y-3">
          <Card className="surface-panel rounded-none">
            <CardHeader className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="korean-display text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">{post.title}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:text-base">
                <span className="korean-display font-medium text-foreground">{authorName}</span>
                <span>·</span>
                <span className="font-mono">{formatDate(post.publishedAt || post.updatedAt)}</span>
                <span>·</span>
                <span className="font-mono">{readingMinutes} min read</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {(post.tags ?? []).map((tag) => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(normalizeSlugInput(tag) || tag)}`}>
                    <Badge
                      variant="outline"
                      className="rounded-sm px-3 py-1.5 text-sm transition-opacity hover:opacity-80"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardHeader>
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

          <RelatedPostsClient slug={post.slug} />

          <Suspense
            fallback={
              <Card className="surface-panel rounded-none">
                <CardHeader>
                  <CardTitle className="korean-display text-2xl">댓글 남기기</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-24 w-full animate-pulse bg-muted/40" />
                </CardContent>
              </Card>
            }
          >
            <PublicCommentsCard
              postId={post.id}
              slug={post.slug}
              commentError={commentError ?? null}
              commentSuccess={commentSuccess}
            />
          </Suspense>
        </article>

        <aside className="order-1 min-w-0 self-start lg:order-3 lg:sticky lg:top-4">
          <Card className="surface-panel rounded-none gap-0 py-0">
            <CardContent className="max-h-[calc(100dvh-6rem)] overflow-auto p-3">
              <ScrollToc contentSelector="#public-post-content" />
            </CardContent>
          </Card>
        </aside>
      </div>
      <div id="page-bottom" className="h-px w-full" aria-hidden="true" />
    </main>
  );
}
