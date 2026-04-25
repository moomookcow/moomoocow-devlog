import VelogEditor from "@/components/admin/velog-editor";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

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
  save_failed: "글 저장에 실패했습니다. posts 테이블/RLS/컬럼 구성을 확인해주세요.",
};

const SUCCESS_MESSAGE: Record<string, string> = {
  draft: "임시저장이 완료되었습니다.",
  published: "출간이 완료되었습니다.",
};

export default async function AdminNewPage({ searchParams }: AdminNewPageProps) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin/new");

  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? ERROR_MESSAGE[params.error] : null;
  const successMessage = params?.success ? SUCCESS_MESSAGE[params.success] : null;

  return (
    <main className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-background px-4 py-4 sm:px-6 lg:px-8">
      {errorMessage ? (
        <p className="mb-3 shrink-0 border border-destructive/35 px-3 py-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mb-3 shrink-0 border border-border/60 px-3 py-2 text-sm text-foreground" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <VelogEditor action={createPostAction} />
      </div>
    </main>
  );
}
