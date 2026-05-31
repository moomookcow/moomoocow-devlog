"use server";

import { redirect } from "next/navigation";

import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { createCategory, deleteCategoryById, listAdminCategories, moveCategoryById, updateCategoryById } from "@/lib/categories";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function basePath() {
  return "/admin/categories";
}

function readSelectedPath(formData: FormData) {
  const l1 = String(formData.get("l1") ?? "").trim();
  const l2 = String(formData.get("l2") ?? "").trim();
  const l3 = String(formData.get("l3") ?? "").trim();
  return { l1, l2, l3 };
}

function buildRedirectPath(formData: FormData, extra?: Record<string, string>) {
  const query = new URLSearchParams();
  const { l1, l2, l3 } = readSelectedPath(formData);

  if (l1) query.set("l1", l1);
  if (l2) query.set("l2", l2);
  if (l3) query.set("l3", l3);
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
  }

  const encoded = query.toString();
  return encoded ? `${basePath()}?${encoded}` : basePath();
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
    redirect(buildRedirectPath(formData, { error: "required_name" }));
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
        redirect(buildRedirectPath(formData, { error: "depth_exceeded" }));
      }
    }

    await createCategory(writeClient, {
      name,
      description,
      isActive,
      parentId,
    });
  } catch {
    redirect(buildRedirectPath(formData, { error: "create_failed" }));
  }

  redirect(buildRedirectPath(formData, { success: "created" }));
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
    redirect(buildRedirectPath(formData, { error: "required_name" }));
  }
  if (parentId === id) {
    redirect(buildRedirectPath(formData, { error: "invalid_parent" }));
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
        redirect(buildRedirectPath(formData, { error: "invalid_parent" }));
      }
    } catch {
      redirect(buildRedirectPath(formData, { error: "update_failed" }));
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
      redirect(buildRedirectPath(formData, { error: "depth_exceeded" }));
    }

    await updateCategoryById(writeClient, id, {
      name,
      description,
      isActive,
      parentId,
    });
  } catch {
    redirect(buildRedirectPath(formData, { error: "update_failed" }));
  }

  redirect(buildRedirectPath(formData, { success: "updated" }));
}

export async function deleteCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(buildRedirectPath(formData, { error: "delete_failed" }));

  try {
    await deleteCategoryById(writeClient, id);
  } catch {
    redirect(buildRedirectPath(formData, { error: "delete_failed" }));
  }

  redirect(buildRedirectPath(formData, { success: "deleted" }));
}

export async function moveCategoryAction(formData: FormData) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, basePath());
  const writeClient = createAdminClient() ?? supabase;

  const id = String(formData.get("id") ?? "").trim();
  const directionRaw = String(formData.get("direction") ?? "").trim();
  const direction = directionRaw === "up" ? "up" : directionRaw === "down" ? "down" : null;

  if (!id || !direction) {
    redirect(buildRedirectPath(formData, { error: "move_failed" }));
  }

  try {
    await moveCategoryById(writeClient, id, direction);
  } catch {
    redirect(buildRedirectPath(formData, { error: "move_failed" }));
  }

  redirect(buildRedirectPath(formData, { success: "moved" }));
}
