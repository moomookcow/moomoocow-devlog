import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export type CategoryTreeItem = {
  name: string;
  posts: string[];
};

export type CategoryGroup = {
  name: string;
  children: CategoryTreeItem[];
};

type CategoryPanelProps = {
  title?: string;
  groups: CategoryGroup[];
};

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
                    {group.children.map((child) => (
                      <AccordionItem
                        key={`${group.name}-${child.name}`}
                        value={`${group.name}-${child.name}`}
                        className="border-border/40"
                      >
                        <AccordionTrigger className="korean-display cursor-pointer pl-4 text-sm text-muted-foreground">
                          {child.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1 pl-8">
                            {child.posts.map((postTitle) => (
                              <li
                                key={postTitle}
                                className="theme-hover-soft korean-display cursor-pointer rounded-[2px] px-1 py-0.5 text-sm"
                              >
                                {postTitle}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
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
