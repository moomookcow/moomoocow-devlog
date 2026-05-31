import { NextResponse } from "next/server";

import { getPublishedPostBySlug, listPublishedPostSummaries } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

function formatCategoryLabel(value: string | null) {
  if (!value) return "";
  const withSpaces = value.trim().replace(/[-_]+/g, " ");
  if (!/[a-zA-Z]/.test(withSpaces)) return withSpaces;
  return withSpaces.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = createPublicClient();

  try {
    const [post, posts] = await Promise.all([
      getPublishedPostBySlug(supabase, slug),
      listPublishedPostSummaries(supabase, 80),
    ]);

    if (!post) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const currentIndex = posts.findIndex((item) => item.id === post.id);
    const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const prevPost = currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
    const sameCategoryPosts = post.category
      ? posts
          .filter((item) => item.category === post.category)
          .slice(0, 12)
          .map((item) => ({ id: item.id, slug: item.slug, title: item.title }))
      : [];

    return NextResponse.json(
      {
        currentSlug: post.slug,
        category: post.category,
        categoryLabel: formatCategoryLabel(post.category),
        prevPost: prevPost ? { slug: prevPost.slug, title: prevPost.title } : null,
        nextPost: nextPost ? { slug: nextPost.slug, title: nextPost.title } : null,
        sameCategoryPosts,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

