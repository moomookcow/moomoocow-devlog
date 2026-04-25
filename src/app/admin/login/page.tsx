import Link from "next/link";

import LoginForm from "@/components/admin/login-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <Card className="rounded-lg">
        <CardHeader>
          <CardDescription className="font-display text-base tracking-wide sm:text-lg">
            Admin Auth
          </CardDescription>
          <CardTitle className="font-display text-3xl leading-tight sm:text-4xl">
            관리자 로그인
          </CardTitle>
          <CardDescription className="mt-2 text-sm sm:text-base">
            GitHub OAuth로 인증합니다. 로그인 후 allowlist 검사(이메일/GitHub)에 통과한 계정만
            `/admin`에 접근할 수 있습니다.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <LoginForm nextPath={next} />

          <div className="mt-5">
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-md px-5 text-foreground")}
              href="/"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
