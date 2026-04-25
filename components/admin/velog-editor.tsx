"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VelogEditorProps = {
  action: (formData: FormData) => void;
};

export default function VelogEditor({ action }: VelogEditorProps) {
  const [content, setContent] = useState<string>("# 새 글\n\n마크다운으로 작성해보세요.");
  const [title, setTitle] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const summary = useMemo(
    () => content.replace(/[#>*_\-\[\]()`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180),
    [content],
  );

  return (
    <form action={action} className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-2">
        <Input
          name="title"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 text-lg"
          required
        />
        <Input
          name="tags"
          placeholder="태그를 입력하세요 (콤마 구분)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <input name="summary" value={summary} readOnly hidden />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-sm text-muted-foreground">Markdown</div>
          <Textarea
            name="contentMdx"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full min-h-0 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-6 shadow-none"
            placeholder="마크다운으로 글을 작성하세요"
            required
          />
        </div>

        <div className="flex min-h-0 flex-col rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-sm text-muted-foreground">Preview</div>
          <div className="prose prose-sm max-w-none flex-1 overflow-y-auto p-4 dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" name="status" value="draft" variant="outline">
          임시저장
        </Button>
        <Button type="submit" name="status" value="published">
          출간하기
        </Button>
      </div>
    </form>
  );
}

