"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [hasVerticalOverflow, setHasVerticalOverflow] = React.useState(false)

  const updateOverflow = React.useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    setHasVerticalOverflow(viewport.scrollHeight > viewport.clientHeight + 1)
  }, [])

  React.useEffect(() => {
    updateOverflow()

    const viewport = viewportRef.current
    if (!viewport) return

    const onScroll = () => updateOverflow()
    viewport.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateOverflow)

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => updateOverflow()) : null
    resizeObserver?.observe(viewport)
    if (viewport.firstElementChild) {
      resizeObserver?.observe(viewport.firstElementChild)
    }

    return () => {
      viewport.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateOverflow)
      resizeObserver?.disconnect()
    }
  }, [updateOverflow, children])

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("group/scroll-area relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="h-full w-full max-h-[inherit] rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar hasOverflow={hasVerticalOverflow} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  hasOverflow = true,
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props & { hasOverflow?: boolean }) {
  if (!hasOverflow) return null

  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "absolute z-10 flex touch-none p-px opacity-0 transition-[opacity,background-color] duration-150 select-none group-hover/scroll-area:opacity-100 group-focus-within/scroll-area:opacity-100 data-[state=visible]:opacity-100 data-horizontal:bottom-0 data-horizontal:left-0 data-horizontal:h-2.5 data-horizontal:w-full data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:top-0 data-vertical:right-0 data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent data-[state=hidden]:pointer-events-none data-[state=hidden]:opacity-0",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
