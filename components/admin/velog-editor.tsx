"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type VelogEditorProps = {
  action: (formData: FormData) => void;
};

export default function VelogEditor({ action }: VelogEditorProps) {
  const [content, setContent] = useState<string>("# 새 글\n\n");
  const [title, setTitle] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const summary = useMemo(
    () => content.replace(/[#>*_\-\[\]()`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
    [content],
  );

  function addTagsFromRaw(raw: string) {
    const candidates = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (candidates.length === 0) return;

    setTags((prev) => {
      const existing = new Set(prev.map((tag) => tag.toLowerCase()));
      const next = [...prev];

      candidates.forEach((candidate) => {
        const key = candidate.toLowerCase();
        if (!existing.has(key)) {
          existing.add(key);
          next.push(candidate);
        }
      });

      return next;
    });
  }

  function removeTag(target: string) {
    setTags((prev) => prev.filter((tag) => tag !== target));
  }

  const serializedTags = useMemo(() => {
    const draftTags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const existing = new Set(tags.map((tag) => tag.toLowerCase()));
    const merged = [...tags];

    draftTags.forEach((draftTag) => {
      const key = draftTag.toLowerCase();
      if (!existing.has(key)) {
        existing.add(key);
        merged.push(draftTag);
      }
    });

    return merged.join(",");
  }, [tagInput, tags]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  return (
    <form
      action={action}
      className="flex h-full min-h-0 flex-col overflow-hidden"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key !== "Enter") return;

        const target = event.target as HTMLElement;
        if (target instanceof HTMLTextAreaElement) return;

        event.preventDefault();
      }}
    >
      <div className="mb-3 shrink-0 space-y-3">
        <Input
          name="title"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="korean-display h-24 rounded-none border-0 border-b border-border/60 bg-transparent px-0 text-5xl leading-tight shadow-none focus-visible:ring-0 sm:text-6xl md:text-6xl dark:bg-transparent lg:text-7xl"
          required
        />
        <div className="korean-display flex min-h-12 w-full flex-wrap items-center gap-2 border-b border-border/50 bg-transparent px-0 py-1.5 dark:bg-transparent">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="cursor-pointer"
              aria-label={`${tag} 태그 제거`}
            >
              <Badge variant="outline" className="korean-display rounded-sm px-4 py-3 text-xl">
                {tag}
              </Badge>
            </button>
          ))}
          <input
            name="tags-input"
            placeholder={tags.length > 0 ? "" : "태그를 입력하세요 (엔터/쉼표)"}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTagsFromRaw(tagInput);
                setTagInput("");
                return;
              }
              if (event.key === "Backspace" && tagInput.length === 0 && tags.length > 0) {
                event.preventDefault();
                removeTag(tags[tags.length - 1]);
              }
            }}
            onBlur={() => {
              addTagsFromRaw(tagInput);
              setTagInput("");
            }}
            className="h-9 min-w-[12rem] flex-1 border-0 bg-transparent px-0 text-lg shadow-none outline-none placeholder:text-muted-foreground sm:text-xl md:text-xl dark:bg-transparent"
          />
        </div>
      </div>

      <input name="summary" value={summary} readOnly hidden />
      <input name="tags" value={serializedTags} readOnly hidden />

      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
        <div className="min-h-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <Textarea
              ref={contentRef}
              name="contentMdx"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-auto min-h-full resize-none overflow-hidden rounded-none border-0 bg-transparent p-5 font-mono text-[20px] leading-8 shadow-none focus-visible:ring-0 md:text-[26px] md:leading-[2.2rem] dark:bg-transparent"
              placeholder=""
              required
            />
          </ScrollArea>
        </div>

        <div className="min-h-0 overflow-hidden border-l border-border/55">
          <ScrollArea className="h-full w-full">
            <div className="markdown-preview p-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-end gap-2">
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-none px-4")}>
          나가기
        </Link>
        <Button type="submit" name="status" value="draft" variant="outline" className="h-10 rounded-none px-4">
          임시저장
        </Button>
        <Button type="submit" name="status" value="published" className="h-10 rounded-none px-4">
          출간하기
        </Button>
      </div>
    </form>
  );
}
