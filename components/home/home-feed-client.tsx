"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { X } from "lucide-react";

import RightFeedPanel from "@/components/shared/right-feed-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HomePostCard = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  thumbnailUrl: string | null;
  tags: string[];
};

type HomeFeedClientProps = {
  posts: HomePostCard[];
  popularFeedItems: Array<{ id: string; label: string; href: string }>;
  recentCommentFeedItems: Array<{ id: string; label: string; href: string }>;
  initialQuery?: string;
  initialTagSlug?: string;
  initialTagName?: string;
};

function slugifyTagForHref(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\uac00-\ud7a3\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatTagLabel(tag: string) {
  const trimmed = tag.trim();
  if (!trimmed) return "";
  const withSpaces = trimmed.replace(/[-_]+/g, " ");
  if (!/[a-zA-Z]/.test(withSpaces)) {
    return withSpaces;
  }
  return withSpaces.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

export default function HomeFeedClient({
  posts,
  popularFeedItems,
  recentCommentFeedItems,
  initialQuery = "",
  initialTagSlug = "",
  initialTagName = "",
}: HomeFeedClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedTagSlug, setSelectedTagSlug] = useState(initialTagSlug);
  const [activeTagName, setActiveTagName] = useState(initialTagName);

  const lowerQuery = query.trim().toLowerCase();

  const tagOptions = useMemo(() => {
    const tagMap = new Map<string, { slug: string; label: string; count: number }>();
    posts.forEach((post) => {
      (post.tags ?? []).forEach((tag) => {
        const slug = slugifyTagForHref(tag);
        const label = formatTagLabel(tag);
        if (!slug || !label) return;
        const current = tagMap.get(slug);
        if (!current) {
          tagMap.set(slug, { slug, label, count: 1 });
          return;
        }
        current.count += 1;
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
  }, [posts]);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => {
      const tagMatched = selectedTagSlug
        ? (post.tags ?? []).some((tag) => slugifyTagForHref(tag) === selectedTagSlug)
        : true;
      const queryMatched = lowerQuery
        ? [post.title, post.summary, post.category, post.tags.join(" ")].join(" ").toLowerCase().includes(lowerQuery)
        : true;
      return tagMatched && queryMatched;
    });
  }, [lowerQuery, posts, selectedTagSlug]);

  const recentItems = useMemo(
    () =>
      posts.slice(0, 12).map((post) => ({
        id: `recent-${post.slug}`,
        label: post.title,
        href: `/posts/${post.slug}`,
      })),
    [posts],
  );

  const homeFeedSections = [
    {
      title: "인기 글",
      items:
        popularFeedItems.length > 0
          ? popularFeedItems
          : [{ id: "popular-empty", label: "조회 데이터가 아직 없습니다." }],
    },
    { title: "최근 글", items: recentItems },
    {
      title: "최근 댓글",
      items:
        recentCommentFeedItems.length > 0
          ? recentCommentFeedItems
          : [{ id: "comments-empty", label: "아직 댓글이 없습니다." }],
    },
  ];

  return (
    <>
      <section className="space-y-3">
        <div className="surface-subtle flex flex-wrap items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTagSlug("");
              setActiveTagName("");
            }}
            className={cn(
              "korean-display inline-flex cursor-pointer items-center rounded-none border px-2 py-1 text-sm hover:opacity-85",
              !selectedTagSlug ? "border-primary bg-primary text-primary-foreground" : "border-border/60",
            )}
          >
            전체
          </button>
          {tagOptions.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              onClick={() => {
                setSelectedTagSlug(tag.slug);
                setActiveTagName(tag.label);
              }}
              className={cn(
                "korean-display inline-flex cursor-pointer items-center rounded-none border px-2 py-1 text-sm hover:opacity-85",
                selectedTagSlug === tag.slug ? "border-primary bg-primary text-primary-foreground" : "border-border/60",
              )}
            >
              #{tag.label}
            </button>
          ))}
          {tagOptions.length === 0 ? (
            <span className="korean-display inline-flex items-center rounded-none border border-border/60 px-2 py-1 text-sm text-muted-foreground">
              태그 없음
            </span>
          ) : null}
          {selectedTagSlug || lowerQuery ? (
            <button
              type="button"
              onClick={() => {
                setSelectedTagSlug("");
                setActiveTagName("");
                setQuery("");
              }}
              className="ml-auto inline-flex cursor-pointer items-center gap-1 border border-border/60 px-2 py-1 text-xs hover:opacity-85"
            >
              <X className="h-3.5 w-3.5" />
              필터 초기화
            </button>
          ) : null}
        </div>

        {selectedTagSlug || lowerQuery ? (
          <div className="surface-subtle px-3 py-2">
            <p className="korean-display text-sm text-muted-foreground">
              필터: {activeTagName || selectedTagSlug || "전체"} {query.trim() ? `· 검색어 "${query.trim()}"` : ""}
            </p>
          </div>
        ) : null}

        {visiblePosts.map((post) => (
          <article
            key={post.slug}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/posts/${post.slug}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/posts/${post.slug}`);
              }
            }}
            className="group/card block cursor-pointer"
          >
            <Card className="theme-hover-soft surface-panel rounded-none cursor-pointer">
              {post.thumbnailUrl ? (
                <div className="border-b border-border/60">
                  <NextImage
                    src={post.thumbnailUrl}
                    alt={`${post.title} thumbnail`}
                    width={1200}
                    height={630}
                    sizes="(max-width: 1024px) 100vw, 860px"
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {(post.tags ?? []).slice(0, 3).map((tag) => {
                      const hrefSlug = slugifyTagForHref(tag);
                      const label = formatTagLabel(tag);
                      if (!hrefSlug || !label) return null;
                      return (
                        <Link
                          key={`${post.slug}-header-${tag}`}
                          href={`/tags/${encodeURIComponent(hrefSlug)}`}
                          className="inline-flex items-center rounded-sm border border-border/70 bg-muted/70 px-2 py-0.5 font-mono text-xs text-foreground transition-opacity hover:opacity-80"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          #{label}
                        </Link>
                      );
                    })}
                    {post.tags.length === 0 ? (
                      <span className="inline-flex items-center rounded-sm border border-border/70 bg-muted/70 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        #태그없음
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{post.date}</span>
                </div>
                <CardTitle className="korean-display text-2xl transition-opacity duration-150 group-hover/card:opacity-80">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm text-muted-foreground">{post.summary}</p>
              </CardContent>
            </Card>
          </article>
        ))}
        {visiblePosts.length === 0 ? (
          <Card className="surface-panel rounded-none">
            <CardContent className="py-8">
              <p className="korean-display text-lg text-muted-foreground">조건에 맞는 게시글이 없습니다.</p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <aside className="lg:sticky lg:top-24">
        <RightFeedPanel
          panelTitle="피드 패널"
          searchPlaceholder="게시글 검색"
          searchAriaLabel="게시글 검색"
          searchName="q"
          searchValue={query}
          onSearchChange={setQuery}
          sections={homeFeedSections}
        />
      </aside>
    </>
  );
}
