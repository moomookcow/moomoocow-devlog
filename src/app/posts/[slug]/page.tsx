import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PostReadingProgress from "@/components/admin/post-reading-progress";
import PostToc from "@/components/admin/post-toc";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type PostDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type TocItem = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
};

function headingIdify(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripMarkdownInline(value: string): string {
  return value
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([<>])/g, "$1")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .trim();
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const toc: TocItem[] = [];

  for (const line of lines) {
    const match = line.match(/^\s{0,3}(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
    const text = stripMarkdownInline(match[2]);
    if (!text) continue;

    const id = headingIdify(text) || "section";
    toc.push({ id, level, text });
  }

  return toc;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildSlugCandidates(rawSlug: string): string[] {
  const decoded = safeDecodeURIComponent(rawSlug);
  const candidates = [
    rawSlug,
    decoded,
    rawSlug.normalize("NFC"),
    rawSlug.normalize("NFD"),
    decoded.normalize("NFC"),
    decoded.normalize("NFD"),
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

function reactNodeToText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => reactNodeToText(child)).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return reactNodeToText(node.props.children);
  }
  return "";
}

function estimateReadMinutes(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[>#*_~\-|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length === 0) return 1;
  return Math.max(1, Math.ceil(plain.length / 450));
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug: rawSlug } = await params;
  const slugCandidates = buildSlugCandidates(rawSlug);

  const post = await db.post.findFirst({
    where: {
      slug: { in: slugCandidates },
      status: "published",
      deletedAt: null,
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!post) notFound();

  const toc = extractToc(post.contentMdx);
  const sectionPadding = "px-5 sm:px-6 lg:px-8";
  const headingWithId = (children: React.ReactNode, level: "h1" | "h2" | "h3") => {
    const text = stripMarkdownInline(reactNodeToText(children));
    const id = headingIdify(text) || "section";
    return React.createElement(level, { id }, children);
  };

  const updatedLabel = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(post.updatedAt);
  const readMinutes = estimateReadMinutes(post.contentMdx);

  return (
    <>
      <PostReadingProgress targetId="public-post-content-scroll" />
      <main className="mx-auto flex h-[100dvh] w-full max-w-[1800px] min-h-0 flex-col gap-4 overflow-hidden px-4 py-0 sm:px-6 lg:px-8">
        <Card className="flex min-h-0 flex-1 rounded-none">
          <CardHeader className={cn("gap-3", sectionPadding)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardDescription>Public Post</CardDescription>
              <div className="flex items-center gap-2">
                <CardDescription className="mr-2 hidden text-xs sm:block">
                  마지막 수정: {updatedLabel} · {readMinutes} min read
                </CardDescription>
                <Link href="/posts" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-3")}>
                  목록
                </Link>
                <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-3")}>
                  홈
                </Link>
              </div>
            </div>
            <CardTitle className="font-display text-3xl">{post.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((postTag: (typeof post.tags)[number]) => (
                <Badge key={postTag.tagId} variant="outline" className="h-8 rounded-md px-2.5 text-sm">
                  #{postTag.tag.name}
                </Badge>
              ))}
            </div>
            <CardDescription className="text-xs sm:hidden">
              마지막 수정: {updatedLabel} · {readMinutes} min read
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("min-h-0 flex-1", sectionPadding)}>
            <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <ScrollArea
                id="public-post-content-scroll"
                className="mt-2 h-[calc(100%-0.5rem)] rounded-md bg-[color-mix(in_oklab,var(--background)_94%,white_6%)]"
              >
                <article className="md-preview min-h-full bg-[color-mix(in_oklab,var(--background)_92%,white_8%)] p-5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }: { children?: React.ReactNode }) =>
                        headingWithId(children, "h1"),
                      h2: ({ children }: { children?: React.ReactNode }) =>
                        headingWithId(children, "h2"),
                      h3: ({ children }: { children?: React.ReactNode }) =>
                        headingWithId(children, "h3"),
                    }}
                  >
                    {post.contentMdx}
                  </ReactMarkdown>
                </article>
              </ScrollArea>
              <PostToc items={toc} />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
