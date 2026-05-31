import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDraftFromPdfPage() {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin/draft-from-pdf");

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="korean-display break-words text-5xl leading-[0.95] sm:text-7xl">PDF 초안 생성</h1>
        <p className="korean-display mt-3 text-xl text-foreground/90 sm:text-2xl">
          PDF에서 텍스트와 코드를 추출해 블로그 초안을 생성하는 기능을 준비 중입니다.
        </p>
      </section>

      <Card className="surface-panel rounded-none">
        <CardHeader>
          <CardTitle className="korean-display text-2xl">준비 단계</CardTitle>
          <CardDescription>다음 단계에서 PDF 업로드 및 추출 파이프라인을 연결합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. PDF 업로드 입력 UI</p>
          <p>2. 텍스트층 PDF 파싱</p>
          <p>3. OCR 후처리(한글 과분리 텍스트 복원)</p>
          <p>4. 초안 결과를 에디터로 전달</p>
          <div className="pt-2">
            <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}>
              관리자 홈으로
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

