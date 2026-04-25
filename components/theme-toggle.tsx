"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
  window.localStorage.setItem("theme-mode", mode);
}

export default function ThemeToggle() {
  const [pressed, setPressed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("theme-mode") === "light";
  });

  useEffect(() => {
    applyTheme(pressed ? "light" : "dark");
  }, [pressed]);

  return (
    <label suppressHydrationWarning className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <Sun className="size-3 hidden dark:block" />
      <Moon className="size-3 block dark:hidden" />
      <Switch
        checked={pressed}
        onCheckedChange={(value) => {
          setPressed(value);
        }}
        aria-label="테마 전환"
      />
    </label>
  );
}
