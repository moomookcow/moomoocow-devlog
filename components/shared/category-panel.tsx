"use client";

import { useEffect, useState } from "react";
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
  stickyMode?: boolean;
};

function CategoryNodeBranch({
  groupName,
  node,
  path,
  depth,
  expandAll,
}: {
  groupName: string;
  node: CategoryTreeNode;
  path: string;
  depth: number;
  expandAll: boolean;
}) {
  const itemValue = `${groupName}-${path}`;
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const leftPaddingClass = depth === 0 ? "pl-2 sm:pl-4" : depth === 1 ? "pl-4 sm:pl-8" : "pl-6 sm:pl-12";
  const postsPaddingClass = depth === 0 ? "pl-4 sm:pl-8" : depth === 1 ? "pl-6 sm:pl-12" : "pl-8 sm:pl-16";

  return (
    <AccordionItem value={itemValue} className="border-border/40">
      <AccordionTrigger className={`korean-display cursor-pointer text-sm text-muted-foreground hover:no-underline ${leftPaddingClass}`}>
        {node.name}
      </AccordionTrigger>
      <AccordionContent className="[&_a]:no-underline [&_a:hover]:underline [&_a:hover]:underline-offset-2">
        {node.posts.length > 0 ? (
          <ul className={`space-y-1 ${postsPaddingClass}`}>
            {node.posts.map((postItem, index) => {
              const title = typeof postItem === "string" ? postItem : postItem.title;
              const href = typeof postItem === "string" ? undefined : postItem.href;

              return (
              <li
                key={`${itemValue}-${title}-${index}`}
                className="theme-hover-soft korean-display cursor-pointer rounded-[2px] px-1 py-0.5 text-sm"
              >
                {href ? (
                  <Link href={href} className="block truncate whitespace-nowrap overflow-hidden text-ellipsis no-underline hover:opacity-85 hover:underline hover:underline-offset-2">
                    {title}
                  </Link>
                ) : (
                  <span className="block truncate whitespace-nowrap overflow-hidden text-ellipsis">{title}</span>
                )}
              </li>
              );
            })}
          </ul>
        ) : null}
        {hasChildren ? (
          <Accordion
            key={`${itemValue}-${expandAll ? "expanded" : "collapsed"}`}
            multiple
            defaultValue={expandAll ? node.children!.map((_, index) => `${groupName}-${path}-${index}`) : undefined}
            className="w-full"
          >
            {node.children!.map((child, index) => (
              <CategoryNodeBranch
                key={`${itemValue}-${child.name}-${index}`}
                groupName={groupName}
                node={child}
                path={`${path}-${index}`}
                depth={depth + 1}
                expandAll={expandAll}
              />
            ))}
          </Accordion>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function CategoryPanel({ title = "카테고리", groups, stickyMode = false }: CategoryPanelProps) {
  const [expandAllDesktop, setExpandAllDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setExpandAllDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <Card className={stickyMode ? "category-panel surface-panel rounded-none flex flex-col overflow-hidden" : "category-panel surface-panel rounded-none flex flex-col overflow-hidden lg:max-h-[calc(100dvh-26rem)]"}>
      <CardHeader className="pb-2">
        <CardTitle className="korean-display text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <ScrollArea className={stickyMode ? "pr-2" : "pr-2 lg:max-h-[calc(100dvh-32.5rem)]"}>
          <Accordion
            key={`root-${expandAllDesktop ? "expanded" : "collapsed"}`}
            multiple
            defaultValue={expandAllDesktop ? groups.map((group) => group.name) : undefined}
            className="w-full"
          >
            {groups.map((group) => (
              <AccordionItem key={group.name} value={group.name} className="border-border/60">
                <AccordionTrigger className="korean-display cursor-pointer text-base hover:no-underline">{group.name}</AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline [&_a:hover]:underline [&_a:hover]:underline-offset-2">
                  <Accordion
                    key={`${group.name}-${expandAllDesktop ? "expanded" : "collapsed"}`}
                    multiple
                    defaultValue={expandAllDesktop ? group.children.map((_, index) => `${group.name}-${index}`) : undefined}
                    className="w-full"
                  >
                    {group.children.map((child, index) => (
                      <CategoryNodeBranch
                        key={`${group.name}-${child.name}-${index}`}
                        groupName={group.name}
                        node={child}
                        path={String(index)}
                        depth={0}
                        expandAll={expandAllDesktop}
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
