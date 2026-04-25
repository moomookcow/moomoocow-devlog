"use server";

import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createPost } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  const user = await requireAdminOrRedirect(supabase, "/admin/new");

  const title = String(formData.get("title") ?? "").trim();
  const contentMdx = String(formData.get("contentMdx") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";

  if (!title || !contentMdx) {
    redirect("/admin/new?error=required_fields");
  }

  try {
    const created = await createPost(supabase, {
      title,
      summary,
      contentMdx,
      status,
      tagsRaw,
      authorEmail: user.email ?? null,
    });

    if (status === "published") {
      redirect(`/admin/posts/${encodeURIComponent(created.slug)}?success=published`);
    }

    redirect(`/admin/posts/${encodeURIComponent(created.slug)}?success=draft`);
  } catch {
    redirect("/admin/new?error=save_failed");
  }
}
