"use server";

import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createCategory, deleteCategoryById, listAdminCategories, moveCategoryById, updateCategoryById } from "@/lib/categories";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function basePath() {
  return "/admin/categories";
}

type CategoryNode = {
  id: string;
  parentId: string | null;
};

function computeDepth(categoryId: string | null, byId: Map<string, CategoryNode>): number {
  if (!categoryId) return 0;

  let depth = 0;
  let cursor = byId.get(categoryId) ?? null;
  const guard = new Set<string>();

  while (cursor) {
    if (guard.has(cursor.id)) break;
    guard.add(cursor.id);
    depth += 1;
    cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
  }

  return depth;
}

function computeSubtreeHeight(rootId: string, childrenByParent: Map<string, string[]>): number {
  const walk = (id: string): number => {
    const children = childrenByParent.get(id) ?? [];
    if (children.length === 0) return 0;
    return 1 + Math.max(...children.map((childId) => walk(childId)));
  };
  return walk(rootId);
}

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "on") === "on";
  const parentRaw = String(formData.get("parentId") ?? "none").trim();
  const parentId = parentRaw && parentRaw !== "none" ? parentRaw : null;

  if (!name) {
    redirect(`${basePath()}?error=required_name`);
  }

  try {
    if (parentId) {
      const categories = await listAdminCategories(writeClient, 500);
      const byId = new Map(
        categories.map((item) => [
          item.id,
          {
            id: item.id,
            parentId: item.parentId,
          } satisfies CategoryNode,
        ]),
      );
      const parentDepth = computeDepth(parentId, byId);
      if (parentDepth + 1 > 3) {
        redirect(`${basePath()}?error=depth_exceeded`);
      }
    }

    await createCategory(writeClient, {
      name,
      description,
      isActive,
      parentId,
    });
  } catch {
    redirect(`${basePath()}?error=create_failed`);
  }

  redirect(`${basePath()}?success=created`);
}

export async function updateCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "on";
  const parentRaw = String(formData.get("parentId") ?? "none").trim();
  const parentId = parentRaw && parentRaw !== "none" ? parentRaw : null;

  if (!id || !name) {
    redirect(`${basePath()}?error=required_name`);
  }
  if (parentId === id) {
    redirect(`${basePath()}?error=invalid_parent`);
  }

  if (parentId) {
    try {
      const categories = await listAdminCategories(writeClient, 500);
      const childrenByParent = new Map<string | null, Array<{ id: string; parentId: string | null }>>();
      categories.forEach((item) => {
        const key = item.parentId ?? null;
        const next = childrenByParent.get(key) ?? [];
        next.push({ id: item.id, parentId: item.parentId });
        childrenByParent.set(key, next);
      });
      const descendants = new Set<string>();
      const stack = [id];
      while (stack.length > 0) {
        const current = stack.pop()!;
        const children = childrenByParent.get(current) ?? [];
        children.forEach((child) => {
          if (!descendants.has(child.id)) {
            descendants.add(child.id);
            stack.push(child.id);
          }
        });
      }
      if (descendants.has(parentId)) {
        redirect(`${basePath()}?error=invalid_parent`);
      }
    } catch {
      redirect(`${basePath()}?error=update_failed`);
    }
  }

  try {
    const categories = await listAdminCategories(writeClient, 500);
    const byId = new Map(
      categories.map((item) => [
        item.id,
        {
          id: item.id,
          parentId: item.parentId,
        } satisfies CategoryNode,
      ]),
    );
    const childrenByParent = new Map<string, string[]>();
    categories.forEach((item) => {
      if (!item.parentId) return;
      const next = childrenByParent.get(item.parentId) ?? [];
      next.push(item.id);
      childrenByParent.set(item.parentId, next);
    });

    const subtreeHeight = computeSubtreeHeight(id, childrenByParent);
    const nextParentDepth = computeDepth(parentId, byId);
    const nextSelfDepth = nextParentDepth + 1;
    const nextDeepestDepth = nextSelfDepth + subtreeHeight;
    if (nextDeepestDepth > 3) {
      redirect(`${basePath()}?error=depth_exceeded`);
    }

    await updateCategoryById(writeClient, id, {
      name,
      description,
      isActive,
      parentId,
    });
  } catch {
    redirect(`${basePath()}?error=update_failed`);
  }

  redirect(`${basePath()}?success=updated`);
}

export async function deleteCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(`${basePath()}?error=delete_failed`);

  try {
    await deleteCategoryById(writeClient, id);
  } catch {
    redirect(`${basePath()}?error=delete_failed`);
  }

  redirect(`${basePath()}?success=deleted`);
}

export async function moveCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const id = String(formData.get("id") ?? "").trim();
  const directionRaw = String(formData.get("direction") ?? "").trim();
  const direction = directionRaw === "up" ? "up" : directionRaw === "down" ? "down" : null;

  if (!id || !direction) {
    redirect(`${basePath()}?error=move_failed`);
  }

  try {
    await moveCategoryById(writeClient, id, direction);
  } catch {
    redirect(`${basePath()}?error=move_failed`);
  }

  redirect(`${basePath()}?success=moved`);
}
