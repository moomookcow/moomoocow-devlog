import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function estimateReadMinutes(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[>#*_~\-|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length === 0) return 1;
  return Math.max(1, Math.ceil(plain.length / 450));
}

export default async function PostsPage() {
  const posts = await db.post.findMany({
    where: {
      status: "published",
      deletedAt: null,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 sm:py-12">
      <section className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Public Blog</p>
          <h1 className="font-display text-3xl sm:text-4xl">포스트 목록</h1>
        </div>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-md px-4")}>
          홈
        </Link>
      </section>

      {posts.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="py-10">
            <p className="text-sm text-muted-foreground">아직 발행된 글이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-4">
          {posts.map((post) => {
            const publishedLabel = post.publishedAt
              ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(post.publishedAt)
              : "미발행";
            const readMinutes = estimateReadMinutes(post.contentMdx);

            return (
              <Card key={post.id} className="rounded-lg">
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{publishedLabel}</span>
                    <span>·</span>
                    <span>{readMinutes} min read</span>
                  </div>
                  <CardTitle className="text-2xl">
                    <Link
                      href={`/posts/${encodeURIComponent(post.slug)}`}
                      className="transition-opacity hover:opacity-80"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{post.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  {post.tags.map((postTag) => (
                    <Badge key={postTag.tagId} variant="outline" className="h-8 rounded-md px-2.5 text-sm">
                      #{postTag.tag.name}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}
