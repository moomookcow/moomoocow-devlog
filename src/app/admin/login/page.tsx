import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
          Admin Auth
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          관리자 로그인(임시)
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Supabase Auth 연동 전까지는 UI 골격만 제공합니다. 다음 단계에서 이메일
          인증/allowlist 기반 접근 제어를 구현합니다.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-5 text-sm font-medium text-primary-foreground opacity-70"
            type="button"
            disabled
            aria-disabled="true"
          >
            로그인 연동 예정
          </button>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
            href="/admin"
          >
            어드민 임시 대시보드로
          </Link>
        </div>
      </section>
    </main>
  );
}
