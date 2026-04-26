import VelogEditor from "@/components/admin/velog-editor";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";

type AdminNewPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    debug_code?: string;
    debug_message?: string;
  }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required_fields: "제목과 본문은 필수입니다.",
  save_failed: "글 저장에 실패했습니다. posts 테이블/RLS/컬럼 구성을 확인해주세요.",
  save_forbidden: "글 저장 권한이 없습니다. RLS 정책 또는 관리자 키(SUPABASE_SECRET_KEY)를 확인해주세요.",
  posts_table_missing: "posts 테이블을 찾을 수 없습니다. Supabase 테이블 생성 상태를 확인해주세요.",
  save_not_null_violation: "필수 컬럼 제약조건(NOT NULL) 위반으로 저장에 실패했습니다. posts 스키마를 확인해주세요.",
  save_check_violation: "컬럼 값 제약조건(CHECK) 위반으로 저장에 실패했습니다. status/category/visibility 값을 확인해주세요.",
  thumbnail_missing: "썸네일 파일이 비어 있습니다. 다시 선택해주세요.",
  thumbnail_invalid_type: "썸네일은 이미지 파일만 업로드할 수 있습니다.",
  thumbnail_upload_unavailable:
    "SUPABASE_SECRET_KEY가 없어 서버 업로드를 수행할 수 없습니다. URL 입력 또는 환경변수를 확인해주세요.",
  thumbnail_upload_failed:
    "썸네일 업로드에 실패했습니다. Storage 버킷(post-thumbnails)과 정책을 확인해주세요.",
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
  const debugHint =
    params?.error === "save_failed" && (params?.debug_code || params?.debug_message)
      ? `debug_code=${params?.debug_code ?? "-"} / ${params?.debug_message ?? "-"}`
      : null;

  return (
    <main className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-background px-4 py-4 sm:px-6 lg:px-8">
      {errorMessage ? (
        <div className="mb-3 shrink-0 border border-destructive/35 px-3 py-2 text-sm text-destructive" role="alert">
          <p>{errorMessage}</p>
          {debugHint ? <p className="mt-1 text-xs opacity-90">{debugHint}</p> : null}
        </div>
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
