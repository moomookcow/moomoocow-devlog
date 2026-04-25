import VelogEditor from "@/components/admin/velog-editor";

import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";

type AdminNewPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required_fields: "제목과 본문은 필수입니다.",
};

const SUCCESS_MESSAGE: Record<string, string> = {
  draft: "임시저장 완료",
  published: "포스트 발행 완료",
};

export default async function AdminNewPage({ searchParams }: AdminNewPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? ERROR_MESSAGE[params.error] : null;
  const successMessage = params?.success ? SUCCESS_MESSAGE[params.success] : null;

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-none min-h-0 flex-col gap-3 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="text-sm" role="status" style={{ color: "var(--foreground)" }}>
          {successMessage}
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        <VelogEditor action={createPostAction} />
      </div>
    </main>
  );
}
