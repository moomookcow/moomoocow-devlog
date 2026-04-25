"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminAllowed } from "@/lib/admin";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let index = 2;

  // Keep querying until we find an unused slug.
  // This is sufficient for current single-admin workflow.
  while (await db.post.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

function parseTags(raw: string): Array<{ name: string; slug: string }> {
  const unique = new Map<string, { name: string; slug: string }>();

  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((name) => {
      const slug = slugify(name);
      if (!slug) return;
      if (!unique.has(slug)) {
        unique.set(slug, { name, slug });
      }
    });

  return Array.from(unique.values());
}

function getSafeStatus(input: FormDataEntryValue | null): "draft" | "published" {
  return input === "published" ? "published" : "draft";
}

function buildSummary(input: string): string {
  const plain = input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plain.slice(0, 180);
}

export async function createPostAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = directUser ?? session?.user ?? null;

  if (!user || !isAdminAllowed(user)) {
    redirect("/admin/login?error=forbidden");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summaryInput = String(formData.get("summary") ?? "").trim();
  const contentMdx = String(formData.get("contentMdx") ?? "").trim();
  const status = getSafeStatus(formData.get("status"));
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!title || !contentMdx) {
    redirect("/admin/new?error=required_fields");
  }

  const summary = summaryInput || buildSummary(contentMdx) || title;
  const slug = await generateUniqueSlug(title);
  const publishedAt = status === "published" ? new Date() : null;

  await db.post.create({
    data: {
      title,
      summary,
      contentMdx,
      slug,
      status,
      publishedAt,
      authorId: user.id,
      tags: {
        create: tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { slug: tag.slug },
              create: {
                name: tag.name,
                slug: tag.slug,
              },
            },
          },
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/new");

  if (status === "published") {
    redirect("/admin");
  }

  redirect("/admin/new?success=draft");
}
