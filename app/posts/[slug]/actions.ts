"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createComment, getCommentById } from "@/lib/comments";
import { getPublishedPostBySlug } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";

function redirectWithError(slug: string, error: string): never {
  redirect(`/posts/${encodeURIComponent(slug)}?comment_error=${encodeURIComponent(error)}#comments`);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createPostCommentAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw || null;
  const authorName = String(formData.get("authorName") ?? "").trim();
  const authorEmailRaw = String(formData.get("authorEmail") ?? "").trim();
  const authorEmail = authorEmailRaw || null;
  const content = String(formData.get("content") ?? "").trim();

  if (!slug) {
    redirect("/");
  }

  if (!authorName || authorName.length > 40) {
    redirectWithError(slug, "invalid_author_name");
  }
  if (authorEmail && (!isValidEmail(authorEmail) || authorEmail.length > 120)) {
    redirectWithError(slug, "invalid_author_email");
  }
  if (!content || content.length > 2000) {
    redirectWithError(slug, "invalid_content");
  }

  const supabase = createPublicClient();
  const foundPost = await getPublishedPostBySlug(supabase, slug);
  if (!foundPost) {
    redirectWithError(slug, "post_not_found");
  }
  const post = foundPost;

  if (parentId) {
    const parent = await getCommentById(supabase, parentId);
    if (!parent || parent.postId !== post.id || parent.status !== "published") {
      redirectWithError(slug, "invalid_parent");
    }
    // MVP: allow only 1-depth replies (comment -> reply)
    if (parent.parentId) {
      redirectWithError(slug, "reply_depth_exceeded");
    }
  }

  try {
    await createComment(supabase, {
      postId: post.id,
      parentId,
      authorName,
      authorEmail,
      content,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code ?? "unknown";
    const message = (error as { message?: string })?.message ?? "unknown";
    redirect(
      `/posts/${encodeURIComponent(slug)}?comment_error=save_failed&debug_code=${encodeURIComponent(code)}&debug_message=${encodeURIComponent(message)}#comments`,
    );
  }

  revalidatePath(`/posts/${encodeURIComponent(post.slug)}`);
  redirect(`/posts/${encodeURIComponent(post.slug)}?comment_success=1#comments`);
}
