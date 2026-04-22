"use client";

import Link from "next/link";
import { KeyboardEvent, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type VelogEditorProps = {
  action: (formData: FormData) => void | Promise<void>;
};

function insertAtCursor(
  content: string,
  start: number,
  end: number,
  text: string,
): { next: string; cursor: number } {
  return {
    next: `${content.slice(0, start)}${text}${content.slice(end)}`,
    cursor: start + text.length,
  };
}

function surroundSelection(
  content: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
): { next: string; selStart: number; selEnd: number } {
  const selected = content.slice(start, end);
  const next = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;

  return {
    next,
    selStart: start + prefix.length,
    selEnd: end + prefix.length,
  };
}

export default function VelogEditor({ action }: VelogEditorProps) {
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagComposingRef = useRef(false);

  function withEditorSelection(
    handler: (start: number, end: number, value: string) => void,
  ) {
    const el = textareaRef.current;
    if (!el) return;
    handler(el.selectionStart, el.selectionEnd, content);
  }

  function focusWithSelection(start: number, end: number) {
    const el = textareaRef.current;
    if (!el) return;

    queueMicrotask(() => {
      el.focus();
      el.selectionStart = start;
      el.selectionEnd = end;
    });
  }

  function onBold() {
    withEditorSelection((start, end, value) => {
      const { next, selStart, selEnd } = surroundSelection(value, start, end, "**", "**");
      setContent(next);
      focusWithSelection(selStart, selEnd);
    });
  }

  function onItalic() {
    withEditorSelection((start, end, value) => {
      const { next, selStart, selEnd } = surroundSelection(value, start, end, "*", "*");
      setContent(next);
      focusWithSelection(selStart, selEnd);
    });
  }

  function onStrike() {
    withEditorSelection((start, end, value) => {
      const { next, selStart, selEnd } = surroundSelection(value, start, end, "~~", "~~");
      setContent(next);
      focusWithSelection(selStart, selEnd);
    });
  }

  function onInlineCode() {
    withEditorSelection((start, end, value) => {
      const { next, selStart, selEnd } = surroundSelection(value, start, end, "`", "`");
      setContent(next);
      focusWithSelection(selStart, selEnd);
    });
  }

  function onLink() {
    withEditorSelection((start, end, value) => {
      const { next, selStart, selEnd } = surroundSelection(
        value,
        start,
        end,
        "[",
        "](https://)",
      );
      setContent(next);
      focusWithSelection(selStart, selEnd);
    });
  }

  function onImage() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "![image](https://)\n");
      setContent(next);
      focusWithSelection(cursor - 2, cursor - 2);
    });
  }

  function onHeading(level: 1 | 2 | 3) {
    const prefix = `${"#".repeat(level)} `;
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, prefix);
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function onQuote() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "> ");
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function onBulletList() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "- ");
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function onOrderedList() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "1. ");
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function onCodeBlock() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "```\n\n```\n");
      setContent(next);
      focusWithSelection(cursor - 5, cursor - 5);
    });
  }

  function onTable() {
    withEditorSelection((start, end, value) => {
      const block = "| header | header |\n| --- | --- |\n| cell | cell |\n";
      const { next, cursor } = insertAtCursor(value, start, end, block);
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function onHr() {
    withEditorSelection((start, end, value) => {
      const { next, cursor } = insertAtCursor(value, start, end, "\n---\n");
      setContent(next);
      focusWithSelection(cursor, cursor);
    });
  }

  function normalizeTag(raw: string): string {
    return raw.trim().replace(/^#+/, "");
  }

  function addTag(raw: string) {
    const normalized = normalizeTag(raw);
    if (!normalized) return;
    setTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
  }

  function removeTag(target: string) {
    setTags((prev) => prev.filter((tag) => tag !== target));
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (tagComposingRef.current) return;

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
      setTagInput("");
      return;
    }

    if (event.key === "Backspace" && tagInput.length === 0 && tags.length > 0) {
      event.preventDefault();
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function onTagBlur() {
    if (!tagInput.trim()) return;
    addTag(tagInput);
    setTagInput("");
  }

  return (
    <form action={action} className="flex h-full min-h-0 flex-col gap-3.5">
      <Input
        name="title"
        required
        className="editor-title-input editor-no-focus h-20 rounded-none border-0 bg-background px-1 text-4xl font-semibold text-foreground shadow-none ring-0 placeholder:text-muted-foreground/80 focus-visible:border-transparent focus-visible:ring-0 dark:bg-background sm:text-5xl"
        placeholder="제목을 입력하세요"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
      />

      <div className="flex min-h-12 flex-wrap items-center gap-2 bg-background px-1 py-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="h-8 cursor-pointer rounded-md border-foreground/25 px-2.5 text-sm text-foreground hover:bg-muted/80"
            onClick={() => removeTag(tag)}
            title="클릭해서 태그 제거"
          >
            #{tag}
          </Badge>
        ))}

        <Input
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={onTagBlur}
          onCompositionStart={() => {
            tagComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            tagComposingRef.current = false;
          }}
          className="editor-tags-input editor-no-focus h-10 min-w-48 flex-1 rounded-none border-0 bg-background px-1 text-sm text-foreground shadow-none ring-0 placeholder:text-muted-foreground/80 focus-visible:border-transparent focus-visible:ring-0 dark:bg-background"
          placeholder="태그를 입력하세요 (Enter/쉼표로 추가)"
        />
      </div>

      <input name="tags" type="hidden" value={tags.join(",")} readOnly />

      <input name="summary" type="hidden" value="" readOnly />

      <div className="editor-shell relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border/90 bg-[color-mix(in_oklab,var(--background)_94%,white_6%)]">
        <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-border/80 bg-[color-mix(in_oklab,var(--background)_90%,white_10%)] px-3 py-2 text-xs text-muted-foreground">
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onBold}>B</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onItalic}>I</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onStrike}>S</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={() => onHeading(1)}>H1</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={() => onHeading(2)}>H2</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={() => onHeading(3)}>H3</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onLink}>Link</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onImage}>Image</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onQuote}>Quote</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onBulletList}>UL</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onOrderedList}>OL</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onInlineCode}>Code</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onCodeBlock}>Code Block</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onTable}>Table</Button>
          <Button type="button" variant="ghost" size="xs" className="text-foreground/85 hover:bg-muted/70 hover:text-foreground" onClick={onHr}>HR</Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <ScrollArea className="h-full border-b border-border/80 bg-[color-mix(in_oklab,var(--background)_90%,white_10%)] lg:border-b-0 lg:border-r lg:border-r-border/80">
            <Textarea
              ref={textareaRef}
              id="contentMdx"
              name="contentMdx"
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="editor-main-textarea editor-no-focus min-h-full h-full resize-none rounded-none border-0 bg-transparent p-5 font-mono text-[15px] leading-7 text-foreground shadow-none ring-0 placeholder:text-muted-foreground/80 focus-visible:border-transparent focus-visible:ring-0"
              placeholder="마크다운으로 글을 작성하세요"
            />
          </ScrollArea>

          <ScrollArea className="h-full bg-[color-mix(in_oklab,var(--background)_95%,white_5%)]">
            <article className="md-preview p-6 text-[15px] leading-7 text-foreground">
              {content.trim().length === 0 ? (
                <p className="text-sm text-muted-foreground">오른쪽 미리보기가 여기에 표시됩니다.</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul>{children}</ul>,
                    ol: ({ children }) => <ol>{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                    code: ({ children }) => <code>{children}</code>,
                    pre: ({ children }) => <pre>{children}</pre>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </article>
          </ScrollArea>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 px-4")} href="/admin">
          ← 나가기
        </Link>

        <div className="flex items-center gap-2">
          <Button className="h-10 px-4" variant="outline" type="submit" name="status" value="draft">
            임시저장
          </Button>
          <Button className="h-10 px-4" variant="contrast" type="submit" name="status" value="published">
            출간하기
          </Button>
        </div>
      </div>
    </form>
  );
}
