"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ScrollToc from "@/components/shared/scroll-toc";
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
import { normalizeSlugInput, type AdminPost } from "@/lib/posts";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

type VelogEditorProps = {
  action: (formData: FormData) => void;
  initialPost?: AdminPost;
  categoryOptions?: Array<{ id: string; value: string; label: string; parentId: string | null }>;
};

const EDITOR_IMAGE_BUCKET = "post-thumbnails";
const EDITOR_IMAGE_MAX_WIDTH = 1600;
const EDITOR_IMAGE_MAX_HEIGHT = 1600;
const EDITOR_IMAGE_QUALITY = 0.82;
const SUPABASE_STORAGE_PUBLIC_PATH = "/storage/v1/object/public/post-thumbnails/";

function sanitizeUploadName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";

  return await new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = src;
  });
}

async function optimizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(objectUrl);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, EDITOR_IMAGE_MAX_WIDTH / width, EDITOR_IMAGE_MAX_HEIGHT / height);
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const resized = targetWidth !== width || targetHeight !== height;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", EDITOR_IMAGE_QUALITY);
    });

    if (!blob) return file;

    const compressedEnough = blob.size < file.size * 0.98;
    if (!resized && !compressedEnough) return file;

    const baseName = (file.name || "image").replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${sanitizeUploadName(baseName)}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isSupabaseStorageImage(url: string) {
  return url.includes(SUPABASE_STORAGE_PUBLIC_PATH);
}

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+={}\[\]|\\:;"'<>,.?/]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readNodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(readNodeText).join(" ");
  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return readNodeText(props?.children);
  }
  return "";
}

function MarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (!src || typeof src !== "string") return null;

  if (isSupabaseStorageImage(src)) {
    return (
      <span className="my-5 block w-full overflow-hidden rounded-none">
        <NextImage
          src={src}
          alt={alt ?? "markdown image"}
          width={1600}
          height={900}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-auto w-full object-contain"
        />
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? "markdown image"} loading="lazy" decoding="async" />;
}

const DEFAULT_CATEGORY_OPTIONS = [
  { id: "none-frontend", value: "frontend", label: "프론트엔드", parentId: null },
  { id: "none-backend", value: "backend", label: "백엔드", parentId: null },
  { id: "none-fullstack", value: "fullstack", label: "풀스택", parentId: null },
];

export default function VelogEditor({ action, initialPost, categoryOptions = DEFAULT_CATEGORY_OPTIONS }: VelogEditorProps) {
  const formId = "admin-post-editor-form";
  const isEditMode = Boolean(initialPost);
  const [content, setContent] = useState<string>(initialPost?.contentMdx ?? "# 새 글\n\n");
  const [title, setTitle] = useState<string>(initialPost?.title ?? "");
  const [tags, setTags] = useState<string[]>(initialPost?.tags ?? []);
  const [tagInput, setTagInput] = useState<string>("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState(initialPost?.title ?? "");
  const [publishSlug, setPublishSlug] = useState(initialPost?.slug ?? "");
  const [isPublishSlugDirty, setIsPublishSlugDirty] = useState(false);
  const [publishSummary, setPublishSummary] = useState(initialPost?.summary ?? "");
  const [publishThumbnailUrl, setPublishThumbnailUrl] = useState(initialPost?.thumbnailUrl ?? "");
  const [publishThumbnailFileName, setPublishThumbnailFileName] = useState("");
  const [publishVisibility, setPublishVisibility] = useState(initialPost?.visibility ?? "public");
  const [publishCategory, setPublishCategory] = useState(initialPost?.category ?? "none");
  const [isThumbnailOptimizing, setIsThumbnailOptimizing] = useState(false);
  const [thumbnailOptimizeNotice, setThumbnailOptimizeNotice] = useState<string | null>(null);
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const [editorImageError, setEditorImageError] = useState<string | null>(null);
  const [isEditorDragOver, setIsEditorDragOver] = useState(false);
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

  const previewMarkdownComponents = useMemo(() => {
    const used = new Map<string, number>();
    const createHeading = (tag: "h1" | "h2" | "h3", fallback: string) => {
      return function HeadingRenderer({ children }: { children?: ReactNode }) {
        const text = readNodeText(children).trim();
        const base = slugifyHeading(text) || fallback;
        const count = (used.get(base) ?? 0) + 1;
        used.set(base, count);
        const id = count === 1 ? base : `${base}-${count}`;
        if (tag === "h1") return <h1 id={id}>{children}</h1>;
        if (tag === "h2") return <h2 id={id}>{children}</h2>;
        return <h3 id={id}>{children}</h3>;
      };
    };

    return {
      img: ({ src, alt }: { src?: string | Blob; alt?: string }) => <MarkdownImage src={src} alt={alt} />,
      h1: createHeading("h1", "h1"),
      h2: createHeading("h2", "h2"),
      h3: createHeading("h3", "h3"),
    };
  }, [content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const categoryById = useMemo(
    () => new Map(categoryOptions.map((category) => [category.id, category])),
    [categoryOptions],
  );
  const categoryByValue = useMemo(
    () => new Map(categoryOptions.map((category) => [category.value, category])),
    [categoryOptions],
  );
  const rootCategories = useMemo(
    () => categoryOptions.filter((category) => category.parentId === null),
    [categoryOptions],
  );
  const selectedCategory = categoryByValue.get(publishCategory) ?? null;
  const selectedPath = useMemo(() => {
    if (!selectedCategory) return [] as Array<{ id: string; value: string; label: string; parentId: string | null }>;
    const path = [selectedCategory];
    let cursor = selectedCategory;
    for (let depth = 0; depth < 4; depth += 1) {
      if (!cursor.parentId) break;
      const parent = categoryById.get(cursor.parentId);
      if (!parent) break;
      path.push(parent);
      cursor = parent;
    }
    return path.reverse();
  }, [selectedCategory, categoryById]);
  const selectedRootId = selectedPath[0]?.id ?? "none";
  const selectedChildId = selectedPath[1]?.id ?? "none";
  const selectedCategoryLabel = selectedCategory?.label ?? "카테고리 선택";
  const childCategories = useMemo(() => {
    if (selectedRootId === "none") return [] as typeof categoryOptions;
    return categoryOptions.filter((category) => category.parentId === selectedRootId);
  }, [categoryOptions, selectedRootId]);
  const grandChildCategories = useMemo(() => {
    if (selectedChildId === "none") return [] as typeof categoryOptions;
    return categoryOptions.filter((category) => category.parentId === selectedChildId);
  }, [categoryOptions, selectedChildId]);
  const isKeepingExistingThumbnail =
    Boolean(initialPost?.thumbnailUrl) &&
    publishThumbnailUrl === initialPost?.thumbnailUrl &&
    publishThumbnailFileName.length === 0;

  function insertMarkdownAtCursor(markdown: string) {
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;

    setContent((prev) => `${prev.slice(0, start)}${markdown}${prev.slice(end)}`);

    requestAnimationFrame(() => {
      if (!textarea) return;
      const nextPos = start + markdown.length;
      textarea.focus();
      textarea.setSelectionRange(nextPos, nextPos);
    });
  }

  async function uploadEditorImage(file: File) {
    if (!file) return;

    setEditorImageError(null);

    if (!file.type.startsWith("image/")) {
      setEditorImageError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    try {
      setIsEditorImageUploading(true);
      const supabase = createSupabaseBrowserClient();
      const optimizedFile = await optimizeImageFile(file);
      const safeName = sanitizeUploadName(optimizedFile.name || "image");
      const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
      const path = `editor/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const uploaded = await supabase.storage.from(EDITOR_IMAGE_BUCKET).upload(path, optimizedFile, {
        cacheControl: "3600",
        contentType: optimizedFile.type,
        upsert: false,
      });

      if (uploaded.error) {
        throw uploaded.error;
      }

      const publicUrl = supabase.storage.from(EDITOR_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      if (!publicUrl) {
        throw new Error("NO_PUBLIC_URL");
      }

      const alt = (file.name || "image").replace(/\.[^.]+$/, "");
      insertMarkdownAtCursor(`\n![${alt}](${publicUrl})\n`);
    } catch {
      setEditorImageError("본문 이미지 업로드에 실패했습니다. Storage 버킷/정책을 확인해주세요.");
    } finally {
      setIsEditorImageUploading(false);
    }
  }

  async function onThumbnailFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setThumbnailOptimizeNotice(null);

    if (!file) {
      setPublishThumbnailFileName("");
      return;
    }

    try {
      setIsThumbnailOptimizing(true);
      const optimizedFile = await optimizeImageFile(file);

      if (typeof DataTransfer !== "undefined") {
        const transfer = new DataTransfer();
        transfer.items.add(optimizedFile);
        input.files = transfer.files;
      } else {
        setThumbnailOptimizeNotice("브라우저 제한으로 원본 파일을 사용합니다.");
      }

      setPublishThumbnailFileName(optimizedFile.name);
      setPublishThumbnailUrl("");
    } catch (error) {
      console.warn("[thumbnail-optimize] fallback to original file", error);
      setPublishThumbnailFileName(file.name);
      setThumbnailOptimizeNotice("원본 파일로 업로드합니다.");
    } finally {
      setIsThumbnailOptimizing(false);
    }
  }

  async function onEditorDrop(event: DragEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setIsEditorDragOver(false);
    if (isEditorImageUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await uploadEditorImage(file);
  }

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
      {isEditMode ? <input name="slug" value={initialPost?.slug ?? ""} readOnly hidden /> : null}
      <input name="publishTitle" value={publishTitle} readOnly hidden />
      <input name="publishSlug" value={publishSlug} readOnly hidden />
      <input name="publishSummary" value={publishSummary} readOnly hidden />
      <input name="publishThumbnailUrl" value={publishThumbnailUrl} readOnly hidden />
      <input name="publishThumbnailFileName" value={publishThumbnailFileName} readOnly hidden />
      <input name="publishVisibility" value={publishVisibility} readOnly hidden />
      <input name="publishCategory" value={publishCategory} readOnly hidden />

      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
        <div className="relative min-h-0 overflow-hidden">
          {isEditorImageUploading ? (
            <div className="korean-display border-b border-border/50 px-5 py-2 text-xs text-muted-foreground">
              이미지 업로드 중...
            </div>
          ) : null}
          {editorImageError ? (
            <div className="korean-display border-b border-destructive/40 px-5 py-2 text-xs text-destructive">
              {editorImageError}
            </div>
          ) : null}
          <ScrollArea className="h-full w-full">
            <Textarea
              ref={contentRef}
              name="contentMdx"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isEditorDragOver) setIsEditorDragOver(true);
              }}
              onDragLeave={() => setIsEditorDragOver(false)}
              onDrop={onEditorDrop}
              className="h-auto min-h-full resize-none overflow-hidden rounded-none border-0 bg-transparent p-5 font-mono text-[20px] leading-8 shadow-none focus-visible:ring-0 md:text-[26px] md:leading-[2.2rem] dark:bg-transparent"
              placeholder=""
              required
            />
          </ScrollArea>
          {isEditorDragOver ? (
            <div className="korean-display pointer-events-none absolute bottom-3 left-3 rounded-none border border-border/70 bg-card/90 px-2 py-1 text-[11px] text-foreground/90">
              이미지를 놓으면 본문에 삽입됩니다
            </div>
          ) : null}
        </div>

        <div className="min-h-0 overflow-hidden border-l border-border/55">
          <div className={cn("grid h-full min-h-0", !isEditMode && "lg:grid-cols-[minmax(0,1fr)_240px]")}>
            <ScrollArea className="h-full w-full">
              <div id="editor-preview-content" className="markdown-preview p-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewMarkdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            </ScrollArea>
            {!isEditMode ? (
              <div className="hidden min-h-0 border-l border-border/50 lg:block">
                <ScrollArea className="h-full w-full">
                  <div className="p-4">
                    <ScrollToc contentSelector="#editor-preview-content" />
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
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
            setPublishSlug(normalizeSlugInput(title));
            setIsPublishSlugDirty(false);
            setPublishSummary(summary);
            setPublishThumbnailFileName("");
            setPublishOpen(true);
          }}
        >
          {isEditMode ? "수정하기" : "출간하기"}
        </Button>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="rounded-none p-0 sm:max-w-4xl lg:max-w-5xl">
          <DialogHeader className="korean-display gap-3 border-b border-border/60 px-8 pt-7 pb-6">
            <DialogTitle className="korean-display text-3xl leading-tight">{isEditMode ? "수정 설정" : "출간 설정"}</DialogTitle>
            <DialogDescription className="korean-display text-base">
              {isEditMode ? "수정할 메타 정보를 확인한 뒤 저장하세요." : "최종 메타 정보를 확인한 뒤 출간하세요."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 px-8 py-7">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <label htmlFor="publishThumbnailFile" className="korean-display text-base text-muted-foreground">
                  썸네일 업로드
                </label>
                <Input
                  ref={thumbnailFileRef}
                  form={formId}
                  id="publishThumbnailFile"
                  name="publishThumbnailFile"
                  type="file"
                  accept="image/*"
                  onChange={onThumbnailFileChange}
                  className="korean-display h-11 rounded-none text-base file:mr-3 file:rounded-none file:border-0 file:bg-muted file:px-3 file:py-1.5"
                />
                {isThumbnailOptimizing || thumbnailOptimizeNotice || publishThumbnailFileName ? (
                  <div className="space-y-1 pt-0.5">
                    {isThumbnailOptimizing ? (
                      <p className="korean-display text-sm text-muted-foreground">썸네일 최적화 중...</p>
                    ) : null}
                    {thumbnailOptimizeNotice ? (
                      <p className="korean-display text-sm text-muted-foreground">{thumbnailOptimizeNotice}</p>
                    ) : null}
                    {publishThumbnailFileName ? (
                      <p className="korean-display text-sm text-muted-foreground">선택된 파일: {publishThumbnailFileName}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid content-start gap-1.5">
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
                {isKeepingExistingThumbnail || publishThumbnailUrl ? (
                  <div className="space-y-2 pt-0.5">
                    {isKeepingExistingThumbnail ? (
                      <p className="korean-display text-sm text-foreground/85">현재 썸네일 유지됨</p>
                    ) : null}
                    {publishThumbnailUrl ? (
                      <div className="surface-subtle rounded-none border p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={publishThumbnailUrl}
                          alt="썸네일 미리보기"
                          className="h-32 w-full rounded-none object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="publishTitle" className="korean-display text-base text-muted-foreground">
                제목
              </label>
              <Input
                id="publishTitle"
                value={publishTitle}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setPublishTitle(nextTitle);
                  if (!isPublishSlugDirty) {
                    setPublishSlug(normalizeSlugInput(nextTitle));
                  }
                }}
                placeholder="출간 제목"
                className="korean-display h-11 rounded-none text-lg"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="publishSlug" className="korean-display text-base text-muted-foreground">
                URL 슬러그
              </label>
              <Input
                id="publishSlug"
                value={publishSlug}
                onChange={(e) => {
                  setPublishSlug(normalizeSlugInput(e.target.value));
                  setIsPublishSlugDirty(true);
                }}
                placeholder="url-path-slug"
                className="korean-display h-11 rounded-none font-mono text-base"
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
                <div className="grid gap-2">
                  <Select
                    value={selectedRootId}
                    onValueChange={(value) => {
                      if (!value || value === "none") {
                        setPublishCategory("none");
                        return;
                      }
                      const selected = categoryById.get(value);
                      if (!selected) return;
                      setPublishCategory(selected.value);
                    }}
                  >
                    <SelectTrigger className="korean-display surface-panel h-14 w-full rounded-none border-2 bg-card/30 px-4 text-base data-[size=default]:h-14 data-[size=sm]:h-14">
                      <SelectValue>{selectedRootId === "none" ? "대분류 선택" : selectedPath[0]?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="none" className="korean-display min-h-11 py-2 text-base">
                        미지정
                      </SelectItem>
                      {rootCategories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                          className="korean-display min-h-11 py-2 text-base"
                        >
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {childCategories.length > 0 ? (
                    <Select
                      value={selectedChildId}
                      onValueChange={(value) => {
                        if (!value || value === "none") {
                          const root = categoryById.get(selectedRootId);
                          setPublishCategory(root?.value ?? "none");
                          return;
                        }
                        const selected = categoryById.get(value);
                        if (!selected) return;
                        setPublishCategory(selected.value);
                      }}
                    >
                      <SelectTrigger className="korean-display surface-panel h-14 w-full rounded-none border-2 bg-card/30 px-4 text-base data-[size=default]:h-14 data-[size=sm]:h-14">
                        <SelectValue>{selectedChildId === "none" ? "중분류 선택" : selectedPath[1]?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="none" className="korean-display min-h-11 py-2 text-base">
                          대분류만 사용
                        </SelectItem>
                        {childCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="korean-display min-h-11 py-2 text-base"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}

                  {grandChildCategories.length > 0 ? (
                    <Select
                      value={selectedCategory?.id ?? "none"}
                      onValueChange={(value) => {
                        if (!value || value === "none") {
                          const child = categoryById.get(selectedChildId);
                          setPublishCategory(child?.value ?? "none");
                          return;
                        }
                        const selected = categoryById.get(value);
                        if (!selected) return;
                        setPublishCategory(selected.value);
                      }}
                    >
                      <SelectTrigger className="korean-display surface-panel h-14 w-full rounded-none border-2 bg-card/30 px-4 text-base data-[size=default]:h-14 data-[size=sm]:h-14">
                        <SelectValue>{selectedPath[2]?.label ?? "소분류 선택"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="none" className="korean-display min-h-11 py-2 text-base">
                          중분류만 사용
                        </SelectItem>
                        {grandChildCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="korean-display min-h-11 py-2 text-base"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                <p className="korean-display text-sm text-muted-foreground">최종 선택 카테고리: {selectedCategoryLabel}</p>
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
              {isEditMode ? "수정 저장" : "출간하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
