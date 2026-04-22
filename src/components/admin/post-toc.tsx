"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type TocItem = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
};

type PostTocProps = {
  items: TocItem[];
};

export default function PostToc({ items }: PostTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const ids = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (ids.length === 0) return;

    const headingElements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -70% 0px",
        threshold: [0, 1],
      },
    );

    headingElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  useEffect(() => {
    if (!activeId) return;
    const el = itemRefs.current[activeId];
    if (!el) return;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden p-1">
      <div className="mb-2 flex items-center justify-between px-2 py-2">
        <p className="text-sm font-semibold tracking-[0.12em] text-muted-foreground">
          TABLE OF CONTENTS
        </p>
        <Badge variant="outline" className="rounded-md px-1.5 text-[11px]">
          {items.length}
        </Badge>
      </div>

      <ScrollArea className="h-full">
        {items.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            헤딩(`#`, `##`, `###`)을 추가하면 목차가 표시됩니다.
          </p>
        ) : (
          <nav className="space-y-1 px-1 py-1">
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  className={cn(
                    "block truncate rounded-sm px-2 py-1.5 text-sm text-foreground/70 transition-all hover:bg-muted/40 hover:text-foreground/90",
                    item.level === 2 && "ml-2",
                    item.level === 3 && "ml-4 text-foreground/70",
                    active && "bg-muted/50 font-bold text-[color:var(--foreground)]",
                  )}
                  title={item.text}
                >
                  {item.text}
                </a>
              );
            })}
          </nav>
        )}
      </ScrollArea>
    </aside>
  );
}
