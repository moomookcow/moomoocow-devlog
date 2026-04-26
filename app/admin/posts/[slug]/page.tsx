import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ScrollToc from "@/components/shared/scroll-toc";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { getPostBySlug } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminPostDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ success?: string }>;
};

const SUCCESS_MESSAGE: Record<string, string> = {
  draft: "임시저장이 완료되었습니다.",
  published: "출간이 완료되었습니다.",
  updated_draft: "임시저장 수정이 완료되었습니다.",
  updated_published: "출간 글 수정이 완료되었습니다.",
};
const SUPABASE_STORAGE_PUBLIC_PATH = "/storage/v1/object/public/post-thumbnails/";

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

function createHeadingRenderers() {
  const used = new Map<string, number>();
  const make = (tag: "h1" | "h2" | "h3", fallbackIdPrefix: string) => {
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
    h1: make("h1", "h1"),
    h2: make("h2", "h2"),
    h3: make("h3", "h3"),
  };
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
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="h-auto w-full object-contain"
        />
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? "markdown image"} loading="lazy" decoding="async" />;
}

export default async function AdminPostDetailPage({ params, searchParams }: AdminPostDetailPageProps) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin");

  const { slug } = await params;
  const post = await getPostBySlug(supabase, slug);

  if (!post) {
    notFound();
  }

  const query = searchParams ? await searchParams : undefined;
  const successMessage = query?.success ? SUCCESS_MESSAGE[query.success] : null;
  const headingRenderers = createHeadingRenderers();

  return (
    <main className="mx-auto min-h-full w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      {successMessage ? (
        <p className="text-sm text-foreground" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{post.status.toUpperCase()}</Badge>
                <span className="text-xs text-muted-foreground">/{post.slug}</span>
              </div>
              <CardTitle className="text-3xl leading-tight">{post.title}</CardTitle>
              <CardDescription>{post.summary || "소개글이 없습니다."}</CardDescription>
              {post.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-md px-4")}>
                  대시보드로
                </Link>
                <Link
                  href={`/admin/new?slug=${encodeURIComponent(post.slug)}`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-md px-4")}
                >
                  글 수정
                </Link>
                <Link href="/admin/new" className={cn(buttonVariants({ variant: "default" }), "h-9 rounded-md px-4")}>
                  새 글 작성
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
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardContent id="admin-post-content" className="markdown-preview p-6">
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
        </section>

        <aside className="self-start lg:sticky lg:top-4">
          <Card className="surface-panel rounded-none">
            <CardContent className="max-h-[calc(100dvh-6rem)] overflow-auto pr-2 pt-0">
              <ScrollToc contentSelector="#admin-post-content" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
