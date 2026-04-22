import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
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
              href="/admin"
              className={cn(buttonVariants({ variant: "contrast" }), "h-11 rounded-md px-5")}
            >
              어드민 페이지
            </Link>
            <Link
              href="https://hermes-agent.nousresearch.com/"
              target="_blank"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-md px-5 text-foreground")}
            >
              Hermes 벤치마크 보기
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
