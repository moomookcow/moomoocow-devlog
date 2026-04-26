"use client";

import { useEffect } from "react";

type AutoScrollBottomProps = {
  enabled: boolean;
};

export default function AutoScrollBottom({ enabled }: AutoScrollBottomProps) {
  useEffect(() => {
    if (!enabled) return;

    const scrollToBottom = () => {
      const scrollElement = document.scrollingElement ?? document.documentElement;
      const top = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        scrollElement.scrollHeight,
      );
      scrollElement.scrollTop = top;
      window.scrollTo({ top, behavior: "auto" });
    };

    const timeouts = [
      window.setTimeout(scrollToBottom, 0),
      window.setTimeout(scrollToBottom, 120),
      window.setTimeout(scrollToBottom, 360),
      window.setTimeout(scrollToBottom, 800),
    ];

    const onLoad = () => scrollToBottom();
    window.addEventListener("load", onLoad);

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("load", onLoad);
    };
  }, [enabled]);

  return null;
}
