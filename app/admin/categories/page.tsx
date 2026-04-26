import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction } from "@/app/admin/categories/actions";
import { CategoryFormFields } from "@/components/admin/category-form-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { requireAdminOrRedirect } from "@/lib/admin-auth";
import { listAdminCategories } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminCategoriesPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    l1?: string;
    l2?: string;
    l3?: string;
  }>;
};

const ERROR_MESSAGE: Record<string, string> = {
  required_name: "카테고리 이름은 필수입니다.",
  invalid_parent: "상위 카테고리를 자기 자신(또는 하위)으로 설정할 수 없습니다.",
  depth_exceeded: "카테고리는 최대 3단계까지만 구성할 수 있습니다.",
  create_failed: "카테고리 생성에 실패했습니다.",
  update_failed: "카테고리 수정에 실패했습니다.",
  delete_failed: "카테고리 삭제에 실패했습니다.",
  move_failed: "카테고리 순서 변경에 실패했습니다.",
};

const SUCCESS_MESSAGE: Record<string, string> = {
  created: "카테고리를 생성했습니다.",
  updated: "카테고리를 수정했습니다.",
  deleted: "카테고리를 삭제했습니다.",
  moved: "카테고리 순서를 변경했습니다.",
};

function categoryHref(level: 1 | 2 | 3, ids: { l1?: string; l2?: string; l3?: string }) {
  const query = new URLSearchParams();
  if (level >= 1 && ids.l1) query.set("l1", ids.l1);
  if (level >= 2 && ids.l2) query.set("l2", ids.l2);
  if (level >= 3 && ids.l3) query.set("l3", ids.l3);
  const encoded = query.toString();
  return encoded ? `/admin/categories?${encoded}` : "/admin/categories";
}

function getNodeClass(isSelected: boolean) {
  return cn(
    "group flex items-center justify-between gap-3 rounded-none px-3 py-2.5 transition-colors cursor-pointer",
    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/45",
  );
}

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const supabase = await createClient();
  await requireAdminOrRedirect(supabase, "/admin/categories");

  const params = searchParams ? await searchParams : undefined;
  const errorMessage = params?.error ? ERROR_MESSAGE[params.error] : null;
  const successMessage = params?.success ? SUCCESS_MESSAGE[params.success] : null;

  let categories = [] as Awaited<ReturnType<typeof listAdminCategories>>;
  let listError = false;

  try {
    categories = await listAdminCategories(supabase, 500);
  } catch {
    listError = true;
  }

  const categoriesById = new Map(categories.map((item) => [item.id, item]));
  const categoriesByParent = new Map<string | null, typeof categories>();
  categories.forEach((item) => {
    const key = item.parentId ?? null;
    const next = categoriesByParent.get(key) ?? [];
    next.push(item);
    categoriesByParent.set(key, next);
  });

  const sortByOrder = (list: typeof categories) => [...list].sort((a, b) => a.sortOrder - b.sortOrder);

  const roots = sortByOrder(categoriesByParent.get(null) ?? []);
  const selectedL1 = roots.find((item) => item.id === params?.l1) ?? null;
  const level2 = selectedL1 ? sortByOrder(categoriesByParent.get(selectedL1.id) ?? []) : [];
  const selectedL2 = level2.find((item) => item.id === params?.l2) ?? null;
  const level3 = selectedL2 ? sortByOrder(categoriesByParent.get(selectedL2.id) ?? []) : [];
  const selectedL3 = level3.find((item) => item.id === params?.l3) ?? null;
  const selectedCategory = selectedL3 ?? selectedL2 ?? selectedL1 ?? null;

  const siblingInfo = new Map<string, { index: number; total: number }>();
  categoriesByParent.forEach((items) => {
    sortByOrder(items).forEach((item, index, arr) => {
      siblingInfo.set(item.id, { index, total: arr.length });
    });
  });

  const orderedForParentSelect = [] as Array<{ id: string; name: string; depth: number }>;
  const walk = (parentId: string | null, depth: number, visited = new Set<string>()) => {
    const children = sortByOrder(categoriesByParent.get(parentId) ?? []);
    children.forEach((child) => {
      if (visited.has(child.id)) return;
      const nextVisited = new Set(visited);
      nextVisited.add(child.id);
      orderedForParentSelect.push({ id: child.id, name: child.name, depth });
      walk(child.id, depth + 1, nextVisited);
    });
  };
  walk(null, 0);

  const descendantsMap = new Map<string, Set<string>>();
  const collectDescendants = (id: string): Set<string> => {
    if (descendantsMap.has(id)) return descendantsMap.get(id)!;
    const result = new Set<string>();
    const children = categoriesByParent.get(id) ?? [];
    children.forEach((child) => {
      result.add(child.id);
      collectDescendants(child.id).forEach((nested) => result.add(nested));
    });
    descendantsMap.set(id, result);
    return result;
  };
  categories.forEach((category) => {
    collectDescendants(category.id);
  });

  const parentPathLabel = (categoryId: string) => {
    const names: string[] = [];
    let cursor = categoriesById.get(categoryId) ?? null;
    const guard = new Set<string>();

    while (cursor?.parentId) {
      if (guard.has(cursor.parentId)) break;
      guard.add(cursor.parentId);
      const parent = categoriesById.get(cursor.parentId) ?? null;
      if (!parent) break;
      names.unshift(parent.name);
      cursor = parent;
    }

    return names.join(" > ");
  };

  const selectedSiblings = selectedCategory ? siblingInfo.get(selectedCategory.id) : null;
  const selectedParentPath = selectedCategory ? parentPathLabel(selectedCategory.id) : "";

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
      <section className="surface-panel mb-4 px-5 py-7 sm:px-8">
        <h1 className="korean-display text-4xl sm:text-5xl">카테고리 관리</h1>
        <p className="korean-display mt-2 text-lg text-foreground/85">Miller Columns 방식으로 계층 구조를 탐색하고 수정합니다.</p>
      </section>

      {errorMessage ? (
        <div className="mb-3 border border-destructive/35 px-3 py-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-3 border border-border/60 px-3 py-2 text-sm text-foreground" role="status">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="surface-panel rounded-none">
          <CardHeader>
            <CardTitle className="korean-display text-2xl">새 카테고리</CardTitle>
            <CardDescription>이름 기반으로 슬러그가 자동 생성됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategoryAction} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="newCategoryName" className="korean-display text-sm text-muted-foreground">
                  이름
                </label>
                <Input id="newCategoryName" name="name" className="h-10 rounded-none" placeholder="예: 프론트엔드" required />
              </div>
              <div className="space-y-1">
                <label htmlFor="newCategoryDesc" className="korean-display text-sm text-muted-foreground">
                  설명(선택)
                </label>
                <Input id="newCategoryDesc" name="description" className="h-10 rounded-none" placeholder="간단한 설명" />
              </div>
              <div className="space-y-2">
                <CategoryFormFields fieldIdPrefix="new-category" parentOptions={orderedForParentSelect} initialParentId={null} initialIsActive />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" className="h-9 rounded-none px-4">
                  생성
                </Button>
                <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-none px-4")}>
                  대시보드로
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">Taxonomy Structure</CardTitle>
              <CardDescription>컬럼을 따라 내려가며 카테고리 종속 관계를 탐색하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {listError ? (
                <p className="text-sm text-destructive">categories 조회에 실패했습니다. `005_create_categories_table.sql` 적용 여부를 확인해주세요.</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 카테고리가 없습니다.</p>
              ) : (
                <div className="grid overflow-hidden border border-border/60 rounded-none lg:grid-cols-3">
                  <section className="min-h-[420px] border-r border-border/60">
                    <div className="surface-subtle flex items-center justify-between px-4 py-3">
                      <h3 className="korean-display text-base">Level 1</h3>
                      <span className="font-mono text-xs text-muted-foreground">{roots.length} items</span>
                    </div>
                    <ScrollArea className="h-[360px] lg:h-[420px]">
                      <div className="space-y-1 p-2">
                        {roots.map((item) => {
                          const selected = selectedL1?.id === item.id;
                          return (
                            <Link key={item.id} href={categoryHref(1, { l1: item.id })} className={getNodeClass(selected)}>
                              <div className="min-w-0">
                                <p className={cn("korean-display truncate text-base", selected ? "text-primary-foreground" : "text-foreground")}>{item.name}</p>
                                <p className={cn("font-mono text-xs", selected ? "text-primary-foreground/85" : "text-muted-foreground")}>/{item.slug}</p>
                              </div>
                              <ChevronRight className={cn("h-4 w-4", selected ? "text-primary-foreground" : "text-muted-foreground")} />
                            </Link>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </section>

                  <section className="min-h-[420px] border-r border-border/60">
                    <div className="surface-subtle flex items-center justify-between px-4 py-3">
                      <h3 className="korean-display text-base">Level 2</h3>
                      <span className="font-mono text-xs text-muted-foreground">{level2.length} items</span>
                    </div>
                    <ScrollArea className="h-[360px] lg:h-[420px]">
                      <div className="space-y-1 p-2">
                        {level2.length === 0 ? (
                          <p className="korean-display px-2 py-3 text-sm text-muted-foreground">상위 카테고리를 먼저 선택하세요.</p>
                        ) : (
                          level2.map((item) => {
                            const selected = selectedL2?.id === item.id;
                            return (
                              <Link key={item.id} href={categoryHref(2, { l1: selectedL1?.id, l2: item.id })} className={getNodeClass(selected)}>
                                <div className="min-w-0">
                                  <p className={cn("korean-display truncate text-base", selected ? "text-primary-foreground" : "text-foreground")}>{item.name}</p>
                                  <p className={cn("font-mono text-xs", selected ? "text-primary-foreground/85" : "text-muted-foreground")}>/{item.slug}</p>
                                </div>
                                <ChevronRight className={cn("h-4 w-4", selected ? "text-primary-foreground" : "text-muted-foreground")} />
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </section>

                  <section className="min-h-[420px]">
                    <div className="surface-subtle flex items-center justify-between px-4 py-3">
                      <h3 className="korean-display text-base">Level 3</h3>
                      <span className="font-mono text-xs text-muted-foreground">{level3.length} items</span>
                    </div>
                    <ScrollArea className="h-[360px] lg:h-[420px]">
                      <div className="space-y-1 p-2">
                        {level3.length === 0 ? (
                          <p className="korean-display px-2 py-3 text-sm text-muted-foreground">중간 카테고리를 선택하면 하위가 표시됩니다.</p>
                        ) : (
                          level3.map((item) => {
                            const selected = selectedL3?.id === item.id;
                            return (
                              <Link key={item.id} href={categoryHref(3, { l1: selectedL1?.id, l2: selectedL2?.id, l3: item.id })} className={getNodeClass(selected)}>
                                <div className="min-w-0">
                                  <p className={cn("korean-display truncate text-base", selected ? "text-primary-foreground" : "text-foreground")}>{item.name}</p>
                                  <p className={cn("font-mono text-xs", selected ? "text-primary-foreground/85" : "text-muted-foreground")}>/{item.slug}</p>
                                </div>
                                <ChevronRight className={cn("h-4 w-4", selected ? "text-primary-foreground" : "text-muted-foreground")} />
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </section>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="surface-panel rounded-none">
            <CardHeader>
              <CardTitle className="korean-display text-2xl">선택 카테고리 편집</CardTitle>
              <CardDescription>컬럼에서 선택한 카테고리를 바로 수정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCategory ? (
                <p className="korean-display text-sm text-muted-foreground">Level 1~3 컬럼에서 카테고리를 선택하세요.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="korean-display text-lg">{selectedCategory.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">/{selectedCategory.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <form action={moveCategoryAction}>
                        <input type="hidden" name="id" value={selectedCategory.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button type="submit" variant="outline" className="h-8 rounded-none px-2.5" disabled={(selectedSiblings?.index ?? 0) === 0}>
                          ↑
                        </Button>
                      </form>
                      <form action={moveCategoryAction}>
                        <input type="hidden" name="id" value={selectedCategory.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-8 rounded-none px-2.5"
                          disabled={(selectedSiblings?.index ?? 0) >= (selectedSiblings?.total ?? 1) - 1}
                        >
                          ↓
                        </Button>
                      </form>
                    </div>
                  </div>

                  <form key={`edit-form-${selectedCategory.id}`} action={updateCategoryAction} className="space-y-3">
                    <input type="hidden" name="id" value={selectedCategory.id} />
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <Input key={`edit-name-${selectedCategory.id}`} name="name" defaultValue={selectedCategory.name} className="h-10 rounded-none" required />
                      <Input
                        key={`edit-description-${selectedCategory.id}`}
                        name="description"
                        defaultValue={selectedCategory.description ?? ""}
                        className="h-10 rounded-none"
                        placeholder="설명(선택)"
                      />
                    </div>
                    <p className="korean-display text-xs text-muted-foreground">상위 경로: {selectedParentPath || "최상위"}</p>
                    <CategoryFormFields
                      key={`edit-fields-${selectedCategory.id}`}
                      fieldIdPrefix={`edit-${selectedCategory.id}`}
                      initialParentId={selectedCategory.parentId}
                      initialIsActive={selectedCategory.isActive}
                      parentOptions={orderedForParentSelect.filter(
                        (item) => item.id !== selectedCategory.id && !descendantsMap.get(selectedCategory.id)?.has(item.id),
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="outline" className="h-9 rounded-none px-4">
                        저장
                      </Button>
                    </div>
                  </form>

                  <div className="flex justify-end">
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={selectedCategory.id} />
                      <Button type="submit" variant="outline" className="h-9 rounded-none px-4 text-destructive hover:text-destructive">
                        삭제
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
