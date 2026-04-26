import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:px-10 sm:py-12">
      {successMessage ? (
        <p className="text-sm text-foreground" role="status">
          {successMessage}
        </p>
      ) : null}

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
      </Card>

      <Card>
        <CardContent className="markdown-preview p-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
            }}
          >
            {post.contentMdx}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </main>
  );
}
