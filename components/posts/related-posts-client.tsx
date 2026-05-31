"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RelatedPostSummary = { slug: string; title: string } | null;
type SameCategoryPost = { id: string; slug: string; title: string };

type RelatedPayload = {
  currentSlug: string;
  category: string | null;
  categoryLabel: string;
  prevPost: RelatedPostSummary;
  nextPost: RelatedPostSummary;
  sameCategoryPosts: SameCategoryPost[];
};

type RelatedPostsClientProps = {
  slug: string;
};

const relatedDataCache = new Map<string, RelatedPayload>();
const relatedPromiseCache = new Map<string, Promise<RelatedPayload | null>>();

function loadRelatedPayload(slug: string): Promise<RelatedPayload | null> {
  const cached = relatedDataCache.get(slug);
  if (cached) return Promise.resolve(cached);

  const inFlight = relatedPromiseCache.get(slug);
  if (inFlight) return inFlight;

  const request = fetch(`/api/posts/${encodeURIComponent(slug)}/related`, { cache: "force-cache" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
    .then((payload: RelatedPayload) => {
      relatedDataCache.set(slug, payload);
      relatedPromiseCache.delete(slug);
      return payload;
    })
    .catch(() => {
      relatedPromiseCache.delete(slug);
      return null;
    });

  relatedPromiseCache.set(slug, request);
  return request;
}

function RelatedFallback() {
  return (
    <Card className="surface-panel rounded-none">
      <CardHeader>
        <CardTitle className="korean-display text-2xl">이전/다음 포스트</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        <div className="surface-subtle h-20 animate-pulse rounded-none" />
        <div className="surface-subtle h-20 animate-pulse rounded-none" />
      </CardContent>
    </Card>
  );
}

export default function RelatedPostsClient({ slug }: RelatedPostsClientProps) {
  const [data, setData] = useState<RelatedPayload | null>(null);

  useEffect(() => {
    let mounted = true;

    loadRelatedPayload(slug).then((payload) => {
      if (!mounted) return;
      setData(payload);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!data) return <RelatedFallback />;

  return (
    <>
      {data.category ? (
        <Accordion multiple defaultValue={["same-category"]} className="w-full border-t border-border/60 pt-2">
          <AccordionItem value="same-category" className="border-b-0">
            <AccordionTrigger className="korean-display rounded-none px-1 py-1 text-xl hover:no-underline sm:text-2xl">
              같은 카테고리 글 · {data.categoryLabel}
            </AccordionTrigger>
            <AccordionContent className="pb-0 [&_a]:no-underline">
              {data.sameCategoryPosts.length > 0 ? (
                <ul className="space-y-1">
                  {data.sameCategoryPosts.map((item) => {
                    const isCurrent = item.slug === data.currentSlug;
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/posts/${encodeURIComponent(item.slug)}`}
                          aria-current={isCurrent ? "page" : undefined}
                          className={cn(
                            "korean-display block rounded-none px-1 py-1 text-xl no-underline sm:text-2xl",
                            isCurrent ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="korean-display px-1 py-1 text-xl text-muted-foreground sm:text-2xl">
                  같은 카테고리 글이 아직 없습니다.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      <Card className="surface-panel rounded-none">
        <CardHeader>
          <CardTitle className="korean-display text-2xl">이전/다음 포스트</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link
            href={data.prevPost ? `/posts/${encodeURIComponent(data.prevPost.slug)}` : "#"}
            aria-disabled={!data.prevPost}
            className="surface-subtle block rounded-none p-3 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <p className="font-mono text-xs text-muted-foreground">PREV</p>
            <p className="korean-display mt-1 line-clamp-2 text-lg">{data.prevPost?.title ?? "이전 포스트 없음"}</p>
          </Link>
          <Link
            href={data.nextPost ? `/posts/${encodeURIComponent(data.nextPost.slug)}` : "#"}
            aria-disabled={!data.nextPost}
            className="surface-subtle block rounded-none p-3 hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <p className="font-mono text-xs text-muted-foreground">NEXT</p>
            <p className="korean-display mt-1 line-clamp-2 text-lg">{data.nextPost?.title ?? "다음 포스트 없음"}</p>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
