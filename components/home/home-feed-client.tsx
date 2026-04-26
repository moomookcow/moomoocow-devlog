"use client";

import NextImage from "next/image";
import Link from "next/link";
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
  recentCommentFeedItems: Array<{ id: string; label: string; href: string }>;
  initialQuery?: string;
  initialCategorySlug?: string;
  initialCategoryName?: string;
};

export default function HomeFeedClient({
  posts,
  recentCommentFeedItems,
  initialQuery = "",
  initialCategorySlug = "",
  initialCategoryName = "",
}: HomeFeedClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(initialCategorySlug);
  const [activeCategoryName, setActiveCategoryName] = useState(initialCategoryName);

  const lowerQuery = query.trim().toLowerCase();

  const categories = useMemo(() => {
    return posts
      .map((post) => post.category)
      .filter((value, idx, arr) => arr.indexOf(value) === idx);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => {
      const categoryMatched = selectedCategorySlug ? post.category === selectedCategorySlug : true;
      const queryMatched = lowerQuery
        ? [post.title, post.summary, post.category, post.tags.join(" ")].join(" ").toLowerCase().includes(lowerQuery)
        : true;
      return categoryMatched && queryMatched;
    });
  }, [lowerQuery, posts, selectedCategorySlug]);

  const popularItems = useMemo(
    () =>
      posts.slice(0, 12).map((post) => ({
        id: `popular-${post.slug}`,
        label: post.title,
        href: `/posts/${post.slug}`,
      })),
    [posts],
  );

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
    { title: "인기 글", items: popularItems },
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
              setSelectedCategorySlug("");
              setActiveCategoryName("");
            }}
            className={cn(
              "korean-display inline-flex cursor-pointer items-center rounded-none border px-2 py-1 text-sm hover:opacity-85",
              !selectedCategorySlug ? "border-primary bg-primary text-primary-foreground" : "border-border/60",
            )}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategorySlug(category);
                setActiveCategoryName(category);
              }}
              className={cn(
                "korean-display inline-flex cursor-pointer items-center rounded-none border px-2 py-1 text-sm hover:opacity-85",
                selectedCategorySlug === category ? "border-primary bg-primary text-primary-foreground" : "border-border/60",
              )}
            >
              {category}
            </button>
          ))}
          {selectedCategorySlug || lowerQuery ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCategorySlug("");
                setActiveCategoryName("");
                setQuery("");
              }}
              className="ml-auto inline-flex cursor-pointer items-center gap-1 border border-border/60 px-2 py-1 text-xs hover:opacity-85"
            >
              <X className="h-3.5 w-3.5" />
              필터 초기화
            </button>
          ) : null}
        </div>

        {selectedCategorySlug || lowerQuery ? (
          <div className="surface-subtle px-3 py-2">
            <p className="korean-display text-sm text-muted-foreground">
              필터: {activeCategoryName || selectedCategorySlug || "전체"} {query.trim() ? `· 검색어 "${query.trim()}"` : ""}
            </p>
          </div>
        ) : null}

        {visiblePosts.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} className="group/card block">
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
                  <Badge variant="outline" className="korean-display rounded-sm px-2 py-2 text-sm">
                    {post.category}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{post.date}</span>
                </div>
                <CardTitle className="korean-display text-2xl transition-opacity duration-150 group-hover/card:opacity-80">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm text-muted-foreground">{post.summary}</p>
              </CardContent>
            </Card>
          </Link>
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
