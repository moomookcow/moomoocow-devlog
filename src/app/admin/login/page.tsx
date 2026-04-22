import Link from "next/link";

import LoginForm from "@/components/admin/login-form";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  forbidden: "allowlist에 등록되지 않은 계정입니다.",
  auth_confirm: "이메일 인증을 확인하지 못했습니다. 다시 시도해주세요.",
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const next = params?.next ?? "/admin";
  const errorKey = params?.error;
  const errorMessage = errorKey ? ERROR_MESSAGE[errorKey] ?? "로그인 중 오류가 발생했습니다." : null;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16 sm:px-10 sm:py-20">
      <section className="rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
        <p className="font-display mb-2 text-base tracking-wide text-muted-foreground sm:text-lg">
          Admin Auth
        </p>
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
          관리자 로그인
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          Supabase 이메일 로그인 링크로 인증합니다. 로그인 후 allowlist 검사에
          통과한 계정만 `/admin`에 접근할 수 있습니다.
        </p>

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <LoginForm nextPath={next} />

        <div className="mt-5">
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
