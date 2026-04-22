"use client";

import { useEffect, useState } from "react";

type PostReadingProgressProps = {
  targetId: string;
};

export default function PostReadingProgress({ targetId }: PostReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;

    const update = () => {
      const max = viewport.scrollHeight - viewport.clientHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }

      const ratio = viewport.scrollTop / max;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    update();
    viewport.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full origin-left bg-[color:var(--foreground)] transition-transform duration-100"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
