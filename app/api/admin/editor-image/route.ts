import { NextResponse } from "next/server";

import { isAdminAllowed } from "@/lib/admin";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const EDITOR_IMAGE_BUCKET = "post-thumbnails";

function sanitizeUploadName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = directUser ?? session?.user ?? null;

  if (!isAdminAllowed(user)) {
    return NextResponse.json({ code: "forbidden", message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { code: "secret_key_missing", message: "SUPABASE_SECRET_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ code: "invalid_file", message: "이미지 파일이 필요합니다." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ code: "invalid_type", message: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }

  const safeName = sanitizeUploadName(file.name || "image");
  const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
  const path = `editor/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const uploaded = await adminClient.storage.from(EDITOR_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploaded.error) {
    return NextResponse.json(
      { code: uploaded.error.name ?? "upload_failed", message: uploaded.error.message ?? "upload failed" },
      { status: 400 },
    );
  }

  const publicUrl = adminClient.storage.from(EDITOR_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!publicUrl) {
    return NextResponse.json({ code: "public_url_missing", message: "Public URL 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl }, { status: 200 });
}
