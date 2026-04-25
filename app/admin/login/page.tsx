import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  forbidden: "허용된 관리자 계정이 아닙니다.",
  auth_confirm: "인증을 확인하지 못했습니다. 다시 시도해주세요.",
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const next = params?.next ?? "/admin";
  const errorKey = params?.error;
  const errorMessage = errorKey ? ERROR_MESSAGE[errorKey] ?? "로그인 중 오류가 발생했습니다." : null;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5 px-4 py-10 sm:px-6 lg:px-8">
      <Card className="surface-panel rounded-none">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <CardTitle className="korean-display text-5xl leading-tight sm:text-6xl">Admin Login</CardTitle>
              <CardDescription className="korean-display text-lg leading-relaxed">
                문을 열 수 있는 건, 허가된 관리자 계정뿐입니다.
              </CardDescription>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "h-11 w-11 rounded-none p-0")}
              href="/"
              aria-label="홈으로 이동"
            >
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {errorMessage ? (
            <p
              className="mb-5 border border-destructive/35 bg-destructive/10 px-4 py-3 text-base text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <LoginForm nextPath={next} />
        </CardContent>
      </Card>
    </main>
  );
}
