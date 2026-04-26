import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  label: string;
  href?: string;
};

type FeedSection = {
  title: string;
  items: FeedItem[];
};

type RightFeedPanelProps = {
  panelTitle?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchAction?: string;
  searchName?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sections: FeedSection[];
  className?: string;
};

function FeedSectionBlock({ title, items }: FeedSection) {
  return (
    <AccordionItem value={title} className="border-border/60">
      <AccordionTrigger className="korean-display cursor-pointer text-xl">{title}</AccordionTrigger>
      <AccordionContent>
        <ul className="space-y-1 pb-1">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="theme-hover-soft flex items-start gap-2 rounded-[2px] px-1 py-0.5 text-sm"
            >
              <span className="font-mono text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="korean-display line-clamp-2 cursor-pointer no-underline decoration-transparent hover:opacity-85 hover:underline hover:decoration-current hover:underline-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="korean-display line-clamp-2 cursor-pointer">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function RightFeedPanel({
  panelTitle = "피드 패널",
  searchPlaceholder = "검색",
  searchAriaLabel = "검색",
  searchAction = "/",
  searchName = "q",
  searchValue = "",
  onSearchChange,
  sections,
  className,
}: RightFeedPanelProps) {
  return (
    <Card
      className={cn(
        "surface-panel rounded-none flex h-auto min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-26rem)] lg:min-h-[520px]",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="korean-display text-2xl">{panelTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        {onSearchChange ? (
          <div className="shrink-0">
            <Input
              name={searchName}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              className="korean-display h-9 text-sm"
            />
          </div>
        ) : (
          <form action={searchAction} method="get" className="shrink-0">
            <Input
              name={searchName}
              defaultValue={searchValue}
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              className="korean-display h-9 text-sm"
            />
          </form>
        )}
        <ScrollArea className="min-h-0 flex-1 pr-2">
          <Accordion multiple defaultValue={sections.map((section) => section.title)} className="w-full">
            {sections.map((section) => (
              <FeedSectionBlock key={section.title} title={section.title} items={section.items} />
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
