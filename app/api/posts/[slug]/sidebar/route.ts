import { NextResponse } from "next/server";

import { buildCategoryPanelGroups } from "@/lib/category-panel-data";
import { listActiveCategories } from "@/lib/categories";
import { listPublishedPostSummaries } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createPublicClient();

  try {
    const [categories, posts] = await Promise.all([
      listActiveCategories(supabase, 120),
      listPublishedPostSummaries(supabase, 80),
    ]);

    const groups = buildCategoryPanelGroups(categories, posts, { hrefBase: "/posts" });
    return NextResponse.json({ groups }, { status: 200 });
  } catch {
    return NextResponse.json({ groups: [] }, { status: 200 });
  }
}

