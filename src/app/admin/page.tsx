import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminEmailAllowed } from "@/lib/admin";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
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

  const publishedCount = posts.filter(
    (post) => post.status === "published",
  ).length;
  const draftCount = posts.filter((post) => post.status === "draft").length;
  const popularPosts = posts
    .filter((post) => post.status === "published")
    .slice(0, 5);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:px-10 sm:py-12">
      <Card className="rounded-lg">
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardDescription className="font-display text-base tracking-wide">
              Admin Dashboard
            </CardDescription>
            <CardTitle className="font-display text-3xl leading-tight sm:text-4xl">
              블로그 운영 대시보드
            </CardTitle>
            <CardDescription>현재 로그인 계정: {user.email}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/new"
              className={cn(buttonVariants({ variant: "contrast" }), "h-9 rounded-md px-4")}
            >
              새 글 작성
            </Link>
            <Link
              href="/auth/signout"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-9 rounded-md px-4 text-foreground",
              )}
            >
              로그아웃
            </Link>
          </div>
        </CardHeader>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-0">
            <CardDescription>전체 글</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{posts.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-0">
            <CardDescription>발행 글</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-0">
            <CardDescription>임시저장</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{draftCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              카테고리/태그 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                아직 태그가 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">#{tag.name}</span>
                    <Badge variant="outline">{tag.posts.length} posts</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              인기 글(임시)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                발행된 글이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {popularPosts.map((post) => (
                  <li key={post.id} className="truncate">
                    {post.title}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">최근 글</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                아직 작성된 글이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Link
                      href={`/admin/posts/${encodeURIComponent(post.slug)}`}
                      className="truncate text-foreground transition-opacity hover:opacity-80"
                      title={`${post.title} 조회`}
                    >
                      {post.title}
                    </Link>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                    >
                      {post.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">최근 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              댓글 기능은 아직 구현 전입니다. Phase 확장 시 연결 예정입니다.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
