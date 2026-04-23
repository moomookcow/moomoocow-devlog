import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type HomePost = Prisma.PostGetPayload<Prisma.PostDefaultArgs>;

export default async function Home() {
  const latestPosts: HomePost[] = await db.post.findMany({
    where: {
      status: "published",
      deletedAt: null,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 3,
  });

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-6 py-12 sm:px-10 sm:py-14">
      <Card className="rounded-lg">
        <CardHeader>
          <CardDescription className="font-display text-base tracking-wide sm:text-lg">
            moomoocow-devlog
          </CardDescription>
          <CardTitle className="font-display text-3xl leading-tight sm:text-4xl">
            기술 개발 기록을 위한 블로그와 어드민을 단계적으로 구축합니다.
          </CardTitle>
          <p className="font-display mt-1 text-xl leading-snug text-foreground/90 sm:text-2xl">
            We are building a technical devlog and admin workspace, step by step.
          </p>
        </CardHeader>
        <CardContent>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Next.js, Supabase, Prisma, shadcn/ui 기반으로 공개 블로그와 작성 어드민을 함께 개발합니다.
            현재는 Phase 0로, 프로젝트 기초 세팅과 디자인 토큰 반영을 진행 중입니다.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Powered by Next.js, Supabase, Prisma, and a benchmark-informed design system inspired by Hermes.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/posts"
              className={cn(buttonVariants({ variant: "contrast" }), "h-11 rounded-md px-5")}
            >
              공개 블로그 보기
            </Link>
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-md px-5 text-foreground")}
            >
              어드민 페이지
            </Link>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">최신 포스트</h2>
          <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground">
            전체 보기
          </Link>
        </div>
        {latestPosts.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="py-8 text-sm text-muted-foreground">
              아직 발행된 포스트가 없습니다.
            </CardContent>
          </Card>
        ) : (
          latestPosts.map((post) => (
            <Card key={post.id} className="rounded-lg">
              <CardHeader className="gap-2">
                <CardTitle className="text-2xl">
                  <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="hover:opacity-80">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">{post.summary}</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
