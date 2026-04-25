"use server";

import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin/new");

  const title = String(formData.get("title") ?? "").trim();
  const contentMdx = String(formData.get("contentMdx") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");

  if (!title || !contentMdx) {
    redirect("/admin/new?error=required_fields");
  }

  if (status === "published") {
    redirect("/admin?success=published");
  }

  redirect("/admin/new?success=draft");
}

