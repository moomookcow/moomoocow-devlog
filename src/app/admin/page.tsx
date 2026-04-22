import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
          Admin Workspace
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          어드민 임시 페이지
        </h1>
        <p className="font-display mt-2 text-xl leading-snug text-foreground/90 sm:text-2xl">
          Temporary admin dashboard is ready for the next phase.
        </p>

        <div className="mt-5 space-y-2 text-sm text-muted-foreground sm:text-base">
          <p>이 화면은 인증/인가 구현 전 임시 골격입니다.</p>
          <p>
            다음 단계에서 Supabase Auth와 allowlist 정책을 적용해 접근 제어를
            연결합니다.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
            href="/admin/login"
          >
            로그인 페이지로 이동
          </Link>
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
