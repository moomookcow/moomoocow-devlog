"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type VelogEditorProps = {
  action: (formData: FormData) => void;
};

export default function VelogEditor({ action }: VelogEditorProps) {
  const formId = "admin-post-editor-form";
  const [content, setContent] = useState<string>("# 새 글\n\n");
  const [title, setTitle] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishSummary, setPublishSummary] = useState("");
  const [publishThumbnailUrl, setPublishThumbnailUrl] = useState("");
  const [publishThumbnailFileName, setPublishThumbnailFileName] = useState("");
  const [publishVisibility, setPublishVisibility] = useState("public");
  const [publishCategory, setPublishCategory] = useState("none");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const thumbnailFileRef = useRef<HTMLInputElement | null>(null);

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

  const categoryOptions = [
    { value: "none", label: "미지정" },
    { value: "frontend", label: "프론트엔드" },
    { value: "backend", label: "백엔드" },
    { value: "fullstack", label: "풀스택" },
    { value: "infra", label: "인프라" },
    { value: "devops", label: "데브옵스" },
    { value: "database", label: "데이터베이스" },
    { value: "ai-ml", label: "AI/ML" },
    { value: "career", label: "커리어" },
    { value: "retrospective", label: "회고" },
    { value: "troubleshooting", label: "트러블슈팅" },
  ];
  const selectedCategoryLabel =
    categoryOptions.find((category) => category.value === publishCategory)?.label ?? "카테고리 선택";

  return (
    <form
      id={formId}
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
      <input name="publishTitle" value={publishTitle} readOnly hidden />
      <input name="publishSummary" value={publishSummary} readOnly hidden />
      <input name="publishThumbnailUrl" value={publishThumbnailUrl} readOnly hidden />
      <input name="publishThumbnailFileName" value={publishThumbnailFileName} readOnly hidden />
      <input name="publishVisibility" value={publishVisibility} readOnly hidden />
      <input name="publishCategory" value={publishCategory} readOnly hidden />

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
        <Button
          type="button"
          className="h-10 rounded-none px-4"
          onClick={() => {
            setPublishTitle(title);
            setPublishSummary(summary);
            setPublishThumbnailFileName("");
            setPublishOpen(true);
          }}
        >
          출간하기
        </Button>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="rounded-none p-0 sm:max-w-4xl lg:max-w-5xl">
          <DialogHeader className="korean-display gap-3 border-b border-border/60 px-8 pt-7 pb-6">
            <DialogTitle className="korean-display text-3xl leading-tight">출간 설정</DialogTitle>
            <DialogDescription className="korean-display text-base">
              최종 메타 정보를 확인한 뒤 출간하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 px-8 py-7">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="grid gap-2.5">
                <label htmlFor="publishThumbnailFile" className="korean-display text-base text-muted-foreground">
                  썸네일 업로드
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    ref={thumbnailFileRef}
                    id="publishThumbnailFile"
                    name="publishThumbnailFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      setPublishThumbnailFileName(file?.name ?? "");
                      if (file) setPublishThumbnailUrl("");
                    }}
                    className="korean-display h-11 rounded-none text-base file:mr-3 file:rounded-none file:border-0 file:bg-muted file:px-3 file:py-1.5"
                  />
                </div>
                {publishThumbnailFileName ? (
                  <p className="korean-display text-sm text-muted-foreground">선택된 파일: {publishThumbnailFileName}</p>
                ) : null}
              </div>

              <div className="grid gap-2.5">
                <label htmlFor="publishThumbnailUrl" className="korean-display text-base text-muted-foreground">
                  썸네일 URL (선택)
                </label>
                <Input
                  id="publishThumbnailUrl"
                  value={publishThumbnailUrl}
                  onChange={(e) => {
                    setPublishThumbnailUrl(e.target.value);
                    if (e.target.value.trim().length > 0) {
                      setPublishThumbnailFileName("");
                      if (thumbnailFileRef.current) thumbnailFileRef.current.value = "";
                    }
                  }}
                  placeholder="https://..."
                  className="korean-display h-11 rounded-none text-base"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="publishTitle" className="korean-display text-base text-muted-foreground">
                제목
              </label>
              <Input
                id="publishTitle"
                value={publishTitle}
                onChange={(e) => setPublishTitle(e.target.value)}
                placeholder="출간 제목"
                className="korean-display h-11 rounded-none text-lg"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="publishSummary" className="korean-display text-base text-muted-foreground">
                소개글
              </label>
              <Textarea
                id="publishSummary"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                className="korean-display min-h-40 rounded-none p-4 text-base leading-7"
                placeholder="이 글을 한 문장으로 소개해보세요."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="korean-display text-base text-muted-foreground">공개 설정</label>
                <RadioGroup
                  value={publishVisibility}
                  onValueChange={(value) => value && setPublishVisibility(value)}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="visibility-public"
                    className={cn(
                      "surface-panel group flex h-20 items-center justify-center rounded-none border-2 px-4 text-base cursor-pointer transition-all",
                      publishVisibility === "public"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-card/20 text-muted-foreground hover:bg-accent/20 hover:text-foreground",
                    )}
                  >
                    <RadioGroupItem id="visibility-public" value="public" className="sr-only" />
                    <span className="korean-display block w-full text-center text-lg leading-none">전체 공개</span>
                  </label>
                  <label
                    htmlFor="visibility-private"
                    className={cn(
                      "surface-panel group flex h-20 items-center justify-center rounded-none border-2 px-4 text-base cursor-pointer transition-all",
                      publishVisibility === "private"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 bg-card/20 text-muted-foreground hover:bg-accent/20 hover:text-foreground",
                    )}
                  >
                    <RadioGroupItem id="visibility-private" value="private" className="sr-only" />
                    <span className="korean-display block w-full text-center text-lg leading-none">비공개</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <label className="korean-display text-base text-muted-foreground">카테고리</label>
                <Select
                  value={publishCategory}
                  onValueChange={(value) => {
                    if (!value) return;
                    setPublishCategory(value);
                  }}
                >
                  <SelectTrigger className="korean-display surface-panel h-20 w-full rounded-none border-2 bg-card/30 px-4 text-lg data-[size=default]:h-20 data-[size=sm]:h-20">
                    <SelectValue>{selectedCategoryLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {categoryOptions.map((category) => (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        className="korean-display min-h-14 py-3 text-lg"
                      >
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 rounded-none border-t border-border/60 bg-card px-8 py-6">
            <DialogClose
              render={<Button type="button" variant="outline" className="korean-display h-12 rounded-none px-6 text-base" />}
            >
              취소
            </DialogClose>
            <Button
              type="submit"
              form={formId}
              name="status"
              value="published"
              className="korean-display h-12 rounded-none px-6 text-base disabled:pointer-events-auto disabled:cursor-not-allowed"
              disabled={!title.trim() || !content.trim()}
            >
              출간하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
