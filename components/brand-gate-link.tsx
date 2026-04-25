"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BrandGateLink() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);

  function onClick() {
    const next = clickCount + 1;
    if (next >= 5) {
      setClickCount(0);
      router.push("/admin/login");
      return;
    }
    setClickCount(next);
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

