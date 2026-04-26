"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type TocItem = {
  id: string;
  label: string;
  depth: number;
};

type ScrollTocProps = {
  contentSelector: string;
  title?: string;
  className?: string;
};

function getScrollRoot(contentRoot: HTMLElement): HTMLElement | null {
  const scrollAreaViewport = contentRoot.closest("[data-radix-scroll-area-viewport]") as HTMLElement | null;
  if (scrollAreaViewport) return scrollAreaViewport;
  return null;
}

function collectTocItems(contentRoot: HTMLElement): TocItem[] {
  const headings = Array.from(contentRoot.querySelectorAll("h1[id], h2[id], h3[id]")) as HTMLElement[];
  return headings.map((heading) => ({
    id: heading.id,
    label: heading.textContent?.trim() || heading.id,
    depth: Number(heading.tagName.replace("H", "")) || 3,
  }));
}

export default function ScrollToc({ contentSelector, title = "Table of contents", className }: ScrollTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const lastSelectorRef = useRef<string>(contentSelector);

  useEffect(() => {
    lastSelectorRef.current = contentSelector;
    const contentRoot = document.querySelector(contentSelector) as HTMLElement | null;
    if (!contentRoot) {
      queueMicrotask(() => {
        if (lastSelectorRef.current !== contentSelector) return;
        setItems([]);
        setActiveId("");
      });
      return;
    }

    const rebuild = () => {
      const next = collectTocItems(contentRoot);
      setItems(next);
      setActiveId((prev) => (next.some((item) => item.id === prev) ? prev : (next[0]?.id ?? "")));
    };

    queueMicrotask(() => {
      if (lastSelectorRef.current !== contentSelector) return;
      rebuild();
    });

    const mutationObserver = new MutationObserver(() => rebuild());
    mutationObserver.observe(contentRoot, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["id"],
    });

    return () => mutationObserver.disconnect();
  }, [contentSelector]);

  useEffect(() => {
    const contentRoot = document.querySelector(contentSelector) as HTMLElement | null;
    if (!contentRoot) return;

    const headings = Array.from(contentRoot.querySelectorAll("h1[id], h2[id], h3[id]")) as HTMLElement[];
    if (headings.length === 0) return;

    const scrollRoot = getScrollRoot(contentRoot);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const nextId = visible[0].target.id;
          setActiveId((prev) => (prev === nextId ? prev : nextId));
        }
      },
      {
        root: scrollRoot,
        rootMargin: "0px 0px -70% 0px",
        threshold: [0, 0.2, 0.6, 1],
      },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [contentSelector, items]);

  const hasItems = items.length > 0;
  const itemList = useMemo(() => items, [items]);

  return (
    <div className={cn("space-y-3", className)}>
      <p className="korean-display text-2xl">{title}</p>
      {hasItems ? (
        <ul className="space-y-1">
          {itemList.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  const contentRoot = document.querySelector(contentSelector) as HTMLElement | null;
                  const target = document.getElementById(item.id);
                  if (!target) return;

                  const scrollRoot = contentRoot ? getScrollRoot(contentRoot) : null;
                  if (scrollRoot) {
                    const nextTop = target.offsetTop - 12;
                    scrollRoot.scrollTo({ top: nextTop, behavior: "smooth" });
                  } else {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }

                  setActiveId(item.id);
                }}
                className={cn(
                  "korean-display block cursor-pointer py-0.5 text-lg transition-colors",
                  item.depth === 1 ? "pl-0" : item.depth === 2 ? "pl-3" : "pl-6",
                  activeId === item.id ? "font-extrabold text-foreground" : "font-medium text-foreground/80 hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">헤딩이 없어 목차를 생성할 수 없습니다.</p>
      )}
    </div>
  );
}
