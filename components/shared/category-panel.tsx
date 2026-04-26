import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export type CategoryPostItem = {
  title: string;
  href?: string;
};

export type CategoryTreeNode = {
  name: string;
  posts: Array<string | CategoryPostItem>;
  children?: CategoryTreeNode[];
};

export type CategoryGroup = {
  name: string;
  children: CategoryTreeNode[];
};

type CategoryPanelProps = {
  title?: string;
  groups: CategoryGroup[];
};

function CategoryNodeBranch({
  groupName,
  node,
  path,
  depth,
}: {
  groupName: string;
  node: CategoryTreeNode;
  path: string;
  depth: number;
}) {
  const itemValue = `${groupName}-${path}`;
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const leftPaddingClass = depth === 0 ? "pl-4" : depth === 1 ? "pl-8" : "pl-12";

  return (
    <AccordionItem value={itemValue} className="border-border/40">
      <AccordionTrigger className={`korean-display cursor-pointer text-sm text-muted-foreground ${leftPaddingClass}`}>
        {node.name}
      </AccordionTrigger>
      <AccordionContent>
        {node.posts.length > 0 ? (
          <ul className={`space-y-1 ${depth === 0 ? "pl-8" : depth === 1 ? "pl-12" : "pl-16"}`}>
            {node.posts.map((postItem, index) => {
              const title = typeof postItem === "string" ? postItem : postItem.title;
              const href = typeof postItem === "string" ? undefined : postItem.href;

              return (
              <li
                key={`${itemValue}-${title}-${index}`}
                className="theme-hover-soft korean-display cursor-pointer rounded-[2px] px-1 py-0.5 text-sm"
              >
                {href ? (
                  <Link href={href} className="block hover:opacity-85">
                    {title}
                  </Link>
                ) : (
                  <span>{title}</span>
                )}
              </li>
              );
            })}
          </ul>
        ) : null}
        {hasChildren ? (
          <Accordion multiple className="w-full">
            {node.children!.map((child, index) => (
              <CategoryNodeBranch
                key={`${itemValue}-${child.name}-${index}`}
                groupName={groupName}
                node={child}
                path={`${path}-${index}`}
                depth={depth + 1}
              />
            ))}
          </Accordion>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function CategoryPanel({ title = "카테고리", groups }: CategoryPanelProps) {
  return (
    <Card className="surface-panel rounded-none flex flex-col overflow-hidden lg:max-h-[calc(100dvh-26rem)]">
      <CardHeader className="pb-2">
        <CardTitle className="korean-display text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ScrollArea className="pr-2 lg:max-h-[calc(100dvh-32.5rem)]">
          <Accordion multiple className="w-full">
            {groups.map((group) => (
              <AccordionItem key={group.name} value={group.name} className="border-border/60">
                <AccordionTrigger className="korean-display cursor-pointer text-base">{group.name}</AccordionTrigger>
                <AccordionContent>
                  <Accordion multiple className="w-full">
                    {group.children.map((child, index) => (
                      <CategoryNodeBranch
                        key={`${group.name}-${child.name}-${index}`}
                        groupName={group.name}
                        node={child}
                        path={String(index)}
                        depth={0}
                      />
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
