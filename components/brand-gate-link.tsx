"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function BrandGateLink() {
  const router = useRouter();
  const pathname = usePathname();
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  function onClick() {
    const now = Date.now();
    clickTimestampsRef.current = [...clickTimestampsRef.current, now].filter(
      (timestamp) => now - timestamp <= 2000,
    );

    if (clickTimestampsRef.current.length >= 5) {
      clickTimestampsRef.current = [];
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      router.push("/admin");
      return;
    }

    if (pathname === "/") {
      return;
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    clickTimerRef.current = setTimeout(() => {
      router.push("/");
    }, 260);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="korean-display cursor-pointer text-2xl leading-none"
      aria-label="브랜드 로고"
      title="moomoocow-devlog"
    >
      moomoocow-devlog
    </button>
  );
}
