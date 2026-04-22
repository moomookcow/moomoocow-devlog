"use client";

import { useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <form action={action} className="flex h-full min-h-0 flex-col gap-3">
      <input
        name="title"
        required
        className="editor-title-input editor-no-focus h-18 border-b border-border bg-transparent px-1 text-4xl font-semibold text-foreground outline-none placeholder:text-muted-foreground sm:text-5xl"
        placeholder="제목을 입력하세요"
      />

      <input
        name="tags"
        className="editor-tags-input editor-no-focus h-11 border-b border-border bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="태그를 입력하세요 (Enter/쉼표로 추가)"
      />

      <input name="summary" type="hidden" value="" readOnly />

      <div className="editor-shell min-h-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="flex flex-wrap gap-2 border-b border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <button type="button" onClick={onBold} className="rounded border border-border px-2 py-1">B</button>
          <button type="button" onClick={onItalic} className="rounded border border-border px-2 py-1">I</button>
          <button type="button" onClick={onStrike} className="rounded border border-border px-2 py-1">S</button>
          <button type="button" onClick={() => onHeading(1)} className="rounded border border-border px-2 py-1">H1</button>
          <button type="button" onClick={() => onHeading(2)} className="rounded border border-border px-2 py-1">H2</button>
          <button type="button" onClick={() => onHeading(3)} className="rounded border border-border px-2 py-1">H3</button>
          <button type="button" onClick={onLink} className="rounded border border-border px-2 py-1">Link</button>
          <button type="button" onClick={onImage} className="rounded border border-border px-2 py-1">Image</button>
          <button type="button" onClick={onQuote} className="rounded border border-border px-2 py-1">Quote</button>
          <button type="button" onClick={onBulletList} className="rounded border border-border px-2 py-1">UL</button>
          <button type="button" onClick={onOrderedList} className="rounded border border-border px-2 py-1">OL</button>
          <button type="button" onClick={onInlineCode} className="rounded border border-border px-2 py-1">Code</button>
          <button type="button" onClick={onCodeBlock} className="rounded border border-border px-2 py-1">Code Block</button>
          <button type="button" onClick={onTable} className="rounded border border-border px-2 py-1">Table</button>
          <button type="button" onClick={onHr} className="rounded border border-border px-2 py-1">HR</button>
        </div>

        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
          <textarea
            ref={textareaRef}
            id="contentMdx"
            name="contentMdx"
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="editor-main-textarea editor-no-focus h-[42vh] resize-y border-b border-border bg-[color-mix(in_oklch,var(--background)_92%,white_8%)] p-5 font-mono text-[15px] leading-7 outline-none lg:h-full lg:resize-none lg:border-b-0 lg:border-r"
            placeholder="마크다운으로 글을 작성하세요"
          />

          <article className="md-preview h-[42vh] overflow-y-auto p-6 text-[15px] leading-7 lg:h-full">
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
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <a
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border px-4 text-sm text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
          href="/admin"
        >
          ← 나가기
        </a>

        <div className="flex items-center gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-border px-4 text-sm font-medium text-foreground transition-colors duration-[var(--motion-normal)] hover:bg-muted"
          type="submit"
          name="status"
          value="draft"
        >
          임시저장
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity duration-[var(--motion-normal)] hover:opacity-90"
          type="submit"
          name="status"
          value="published"
        >
          출간하기
        </button>
        </div>
      </div>
    </form>
  );
}
