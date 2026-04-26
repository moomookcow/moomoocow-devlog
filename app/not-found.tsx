import Link from "next/link";

import BackLinkButton from "@/components/shared/back-link-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-[920px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="surface-panel w-full rounded-none">
        <CardHeader className="space-y-3">
          <p className="font-mono text-xs text-muted-foreground">ERROR 404</p>
          <CardTitle className="korean-display text-4xl leading-tight sm:text-5xl">
            페이지를 찾을 수 없습니다.
          </CardTitle>
          <CardDescription className="korean-display text-base text-foreground/85 sm:text-lg">
            주소가 변경되었거나 삭제된 페이지입니다. 홈으로 이동하거나 이전 화면으로 돌아가세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "h-10 rounded-none px-4")}
          >
            홈으로 이동
          </Link>
          <BackLinkButton />
        </CardContent>
      </Card>
    </main>
  );
}
