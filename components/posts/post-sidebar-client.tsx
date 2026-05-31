"use client";

import { useEffect, useState } from "react";

import CategoryPanel, { type CategoryGroup } from "@/components/shared/category-panel";
import { Card, CardContent } from "@/components/ui/card";

type PostSidebarClientProps = {
  slug: string;
};

const sidebarDataCache = new Map<string, CategoryGroup[]>();
const sidebarPromiseCache = new Map<string, Promise<CategoryGroup[]>>();

function loadSidebarGroups(slug: string): Promise<CategoryGroup[]> {
  const cached = sidebarDataCache.get(slug);
  if (cached) return Promise.resolve(cached);

  const inFlight = sidebarPromiseCache.get(slug);
  if (inFlight) return inFlight;

  const request = fetch(`/api/posts/${encodeURIComponent(slug)}/sidebar`, { cache: "force-cache" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
    .then((data: { groups?: CategoryGroup[] }) => {
      const groups = Array.isArray(data.groups) ? data.groups : [];
      sidebarDataCache.set(slug, groups);
      sidebarPromiseCache.delete(slug);
      return groups;
    })
    .catch(() => {
      sidebarPromiseCache.delete(slug);
      sidebarDataCache.set(slug, []);
      return [];
    });

  sidebarPromiseCache.set(slug, request);
  return request;
}

export default function PostSidebarClient({ slug }: PostSidebarClientProps) {
  const [groups, setGroups] = useState<CategoryGroup[] | null>(null);

  useEffect(() => {
    let mounted = true;

    loadSidebarGroups(slug).then((nextGroups) => {
      if (!mounted) return;
      setGroups(nextGroups);
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!groups) {
    return (
      <Card className="surface-panel rounded-none">
        <CardContent className="space-y-2 p-3">
          <div className="h-6 w-28 animate-pulse bg-muted/40" />
          <div className="h-5 w-full animate-pulse bg-muted/30" />
          <div className="h-5 w-5/6 animate-pulse bg-muted/30" />
          <div className="h-5 w-4/6 animate-pulse bg-muted/30" />
        </CardContent>
      </Card>
    );
  }

  return <CategoryPanel groups={groups} stickyMode />;
}
