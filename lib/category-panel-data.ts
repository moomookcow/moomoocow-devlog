import type { CategoryGroup, CategoryTreeNode } from "@/components/shared/category-panel";
import type { Category } from "@/lib/categories";
import type { AdminPost } from "@/lib/posts";

function treeByCategory(categories: Category[]) {
  const childrenByParent = new Map<string | null, Category[]>();
  categories.forEach((category) => {
    const key = category.parentId ?? null;
    const next = childrenByParent.get(key) ?? [];
    next.push(category);
    childrenByParent.set(key, next);
  });
  return { childrenByParent };
}

export function buildCategoryPanelGroups(
  categories: Category[],
  posts: Array<Pick<AdminPost, "title" | "category" | "slug">>,
  options?: { hrefBase?: "/posts" | "/admin/posts" },
): CategoryGroup[] {
  const hrefBase = options?.hrefBase ?? "/posts";
  const active = categories.filter((item) => item.isActive);
  const { childrenByParent } = treeByCategory(active);
  const top = (childrenByParent.get(null) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);

  const postsByCategorySlug = new Map<string, Array<{ title: string; slug: string }>>();
  posts.forEach((post) => {
    if (!post.category) return;
    const next = postsByCategorySlug.get(post.category) ?? [];
    next.push({ title: post.title, slug: post.slug });
    postsByCategorySlug.set(post.category, next);
  });

  const buildNode = (category: Category): CategoryTreeNode => {
    const children = (childrenByParent.get(category.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const ownPosts = (postsByCategorySlug.get(category.slug) ?? []).slice(0, 8);
    const ownPostItems = ownPosts.map((postItem) => {
      const matched = posts.find((post) => post.slug === postItem.slug);
      return {
        title: postItem.title,
        href: matched ? `${hrefBase}/${encodeURIComponent(matched.slug)}` : undefined,
      };
    });
    const builtChildren = children.map((child) => buildNode(child));
    const hasChildren = builtChildren.length > 0;
    const hasOwnPosts = ownPostItems.length > 0;

    return {
      name: category.name,
      posts: hasOwnPosts ? ownPostItems : hasChildren ? [] : ["등록된 글이 없습니다."],
      children: hasChildren ? builtChildren : undefined,
    };
  };

  return top.map((parent) => {
    const directChildren = (childrenByParent.get(parent.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    if (directChildren.length === 0) {
      const parentPosts = (postsByCategorySlug.get(parent.slug) ?? []).slice(0, 8);
      const parentPostItems = parentPosts.map((postItem) => {
        const matched = posts.find((post) => post.slug === postItem.slug);
        return {
          title: postItem.title,
          href: matched ? `${hrefBase}/${encodeURIComponent(matched.slug)}` : undefined,
        };
      });
      return {
        name: parent.name,
        children: [
          {
            name: "기본",
            posts: parentPostItems.length > 0 ? parentPostItems : ["등록된 글이 없습니다."],
          },
        ],
      };
    }

    return {
      name: parent.name,
      children: directChildren.map((child) => buildNode(child)),
    };
  });
}
