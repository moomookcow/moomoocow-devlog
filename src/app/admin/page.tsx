import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmailAllowed } from "@/lib/admin";
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

  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
          Admin Workspace
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          관리자 대시보드(초기)
        </h1>
        <p className="font-display mt-2 text-xl leading-snug text-foreground/90 sm:text-2xl">
          You are signed in. Admin route protection is now active.
        </p>

        <div className="mt-5 space-y-2 text-sm text-muted-foreground sm:text-base">
          <p>현재 로그인 계정: {user?.email ?? "unknown"}</p>
          <p>
            다음 단계에서 포스트 작성/임시저장/발행 폼과 Supabase DB 저장 로직을
            연결합니다.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-medium transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
            style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
            href="/auth/signout"
          >
            로그아웃
          </a>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
            href="/"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
