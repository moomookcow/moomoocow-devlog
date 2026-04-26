"use client";

import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackLinkButtonProps = {
  className?: string;
  fallbackHref?: string;
  label?: string;
};

export default function BackLinkButton({
  className,
  fallbackHref = "/",
  label = "이전 페이지",
}: BackLinkButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={cn(buttonVariants({ variant: "outline" }), "h-10 rounded-none px-4", className)}
    >
      {label}
    </button>
  );
}
