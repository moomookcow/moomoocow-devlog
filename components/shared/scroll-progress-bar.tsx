"use client";

import { useEffect, useState } from "react";

type ScrollProgressBarProps = {
  className?: string;
};

function calculateScrollProgress() {
  const doc = document.documentElement;
  const total = doc.scrollHeight - doc.clientHeight;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (window.scrollY / total) * 100));
}

export default function ScrollProgressBar({ className }: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const update = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setProgress(calculateScrollProgress());
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        opacity: progress > 0 ? 1 : 0,
      }}
    >
      <div
        className="h-full bg-foreground/90 transition-[width,opacity] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
