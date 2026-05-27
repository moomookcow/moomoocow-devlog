import type { MetadataRoute } from "next";

import { listPublishedPostSummaries, normalizeSlugInput } from "@/lib/posts";
import { getSiteUrl } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const supabase = createPublicClient();

  let publishedPosts = [] as Awaited<ReturnType<typeof listPublishedPostSummaries>>;
  try {
    publishedPosts = await listPublishedPostSummaries(supabase, 2000);
  } catch {
    publishedPosts = [];
  }

  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  publishedPosts.forEach((post) => {
    pages.push({
      url: `${siteUrl}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt ?? now.toISOString()),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  const tagSlugs = new Set<string>();
  publishedPosts.forEach((post) => {
    (post.tags ?? []).forEach((tag) => {
      const slug = normalizeSlugInput(tag);
      if (slug) tagSlugs.add(slug);
    });
  });

  Array.from(tagSlugs)
    .sort()
    .forEach((slug) => {
      pages.push({
        url: `${siteUrl}/tags/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

  return pages;
}
