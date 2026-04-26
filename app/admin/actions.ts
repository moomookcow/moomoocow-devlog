"use server";

import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createPost } from "@/lib/posts";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const THUMBNAIL_BUCKET = "post-thumbnails";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadThumbnailFile(file: File, authorKey: string) {
  if (!file || file.size === 0) return { ok: false as const, code: "thumbnail_missing" as const };
  if (!file.type.startsWith("image/")) return { ok: false as const, code: "thumbnail_invalid_type" as const };

  const adminClient = createAdminClient();
  if (!adminClient) return { ok: false as const, code: "thumbnail_upload_unavailable" as const };

  const safeName = sanitizeFileName(file.name || "thumbnail");
  const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
  const path = `${authorKey}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const upload = await adminClient.storage.from(THUMBNAIL_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) {
    return { ok: false as const, code: "thumbnail_upload_failed" as const };
  }

  const publicUrl = adminClient.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!publicUrl) return { ok: false as const, code: "thumbnail_upload_failed" as const };

  return { ok: true as const, url: publicUrl };
}

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  const user = await requireAdminOrRedirect(supabase, "/admin/new");
  const adminClient = createAdminClient();
  const writeClient = adminClient ?? supabase;

  const title = String(formData.get("title") ?? "").trim();
  const contentMdx = String(formData.get("contentMdx") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const publishTitle = String(formData.get("publishTitle") ?? "").trim();
  const publishSummary = String(formData.get("publishSummary") ?? "").trim();
  const publishThumbnailUrl = String(formData.get("publishThumbnailUrl") ?? "").trim();
  const publishVisibilityRaw = String(formData.get("publishVisibility") ?? "public");
  const publishVisibility = publishVisibilityRaw === "private" ? "private" : "public";
  const publishCategory = String(formData.get("publishCategory") ?? "none").trim() || "none";
  const publishThumbnailFile = formData.get("publishThumbnailFile");
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";
  const finalTitle = status === "published" && publishTitle ? publishTitle : title;
  const finalSummary = status === "published" && publishSummary ? publishSummary : summary;

  if (!finalTitle || !contentMdx) {
    redirect("/admin/new?error=required_fields");
  }

  let finalThumbnailUrl = publishThumbnailUrl;
  if (status === "published") {
    const file = publishThumbnailFile instanceof File ? publishThumbnailFile : null;
    const hasFile = Boolean(file && file.size > 0);
    const hasUrl = Boolean(publishThumbnailUrl);

    if (hasFile && !hasUrl) {
      const authorKey = (user.email ?? "admin").replace(/[^a-z0-9]/gi, "_");
      const upload = await uploadThumbnailFile(file as File, authorKey);

      if (!upload.ok) {
        redirect(`/admin/new?error=${upload.code}`);
      }

      finalThumbnailUrl = upload.url;
    }
  }

  let created: { id: string; slug: string };
  try {
    created = await createPost(writeClient, {
      title: finalTitle,
      summary: finalSummary,
      contentMdx,
      status,
      tagsRaw,
      authorEmail: user.email ?? null,
      visibility: publishVisibility,
      category: publishCategory,
      thumbnailUrl: finalThumbnailUrl || null,
    });

  } catch (error) {
    const code = (error as { code?: string })?.code ?? "";
    const message = String((error as { message?: string })?.message ?? "");
    if (code === "42501") {
      redirect("/admin/new?error=save_forbidden");
    }
    if (code === "42P01" || code === "PGRST205") {
      redirect("/admin/new?error=posts_table_missing");
    }
    if (code === "23502") {
      redirect("/admin/new?error=save_not_null_violation");
    }
    if (code === "23514") {
      redirect("/admin/new?error=save_check_violation");
    }
    console.error("[createPostAction] save failed", { code, message, error });
    const debugCode = encodeURIComponent(code || "unknown");
    const debugMessage = encodeURIComponent(message.slice(0, 160) || "no-message");
    redirect(`/admin/new?error=save_failed&debug_code=${debugCode}&debug_message=${debugMessage}`);
  }

  if (status === "published") {
    redirect(`/admin/posts/${encodeURIComponent(created.slug)}?success=published`);
  }

  redirect(`/admin/posts/${encodeURIComponent(created.slug)}?success=draft`);
}
