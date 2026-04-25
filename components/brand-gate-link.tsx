"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BrandGateLink() {
  const router = useRouter();
  const pathname = usePathname();
  const [clickCount, setClickCount] = useState(0);
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
      setClickCount(0);
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

    setClickCount((prev) => {
      const next = prev + 1;

      if (next >= 5) {
        router.push("/admin");
        return 0;
      }

      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
        router.push("/");
      }, 260);

      return next;
    });
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
