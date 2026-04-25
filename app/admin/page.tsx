import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { getAdminLabel } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await requireAdminOrRedirect(supabase, "/admin");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:px-10 sm:py-12">
      <Card>
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardDescription>Admin Dashboard</CardDescription>
            <CardTitle className="text-3xl leading-tight sm:text-4xl">블로그 운영 대시보드</CardTitle>
            <CardDescription>현재 로그인 계정: {getAdminLabel(user)}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin/new"
              className={cn(buttonVariants({ variant: "default" }), "h-9 rounded-md px-4")}
            >
              새 글 작성
            </a>
            <a href="/auth/signout" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-md px-4")}>
              로그아웃
            </a>
          </div>
        </CardHeader>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>전체 글</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>발행 글</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">0</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>임시저장</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">0</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">상태</CardTitle>
          <CardDescription>Prisma 없이 Supabase Auth + 관리자 라우트 보호 구성이 완료되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Bootstrapped</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
