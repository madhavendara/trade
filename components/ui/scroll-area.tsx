"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function useOverlayScroll() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = React.useState({ height: 0, top: 0 });
  const [hovering, setHovering] = React.useState(false);
  const [scrolling, setScrolling] = React.useState(false);
  const dragRef = React.useRef<{
    startY: number;
    startScrollTop: number;
    scrollRange: number;
    trackRange: number;
  } | null>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) {
      setThumb({ height: 0, top: 0 });
      return;
    }
    const ratio = clientHeight / scrollHeight;
    const height = Math.max(ratio * clientHeight, 28);
    const maxTop = clientHeight - height;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    setThumb({ height, top });
  }, []);

  React.useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  const flashAndFade = () => {
    setScrolling(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setScrolling(false), 700);
  };

  const onScroll = () => {
    measure();
    flashAndFade();
  };

  const onThumbDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    dragRef.current = {
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      scrollRange: el.scrollHeight - el.clientHeight,
      trackRange: el.clientHeight - thumb.height,
    };
    setScrolling(true);
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d || d.trackRange <= 0) return;
      const deltaY = ev.clientY - d.startY;
      el.scrollTop = d.startScrollTop + (deltaY / d.trackRange) * d.scrollRange;
    };
    const onUp = () => {
      dragRef.current = null;
      setScrolling(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const visible = thumb.height > 0 && (hovering || scrolling);

  return { containerRef, thumb, onScroll, onThumbDown, visible, setHovering };
}

export function ScrollArea({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { containerRef, thumb, onScroll, onThumbDown, visible, setHovering } = useOverlayScroll();

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      {...props}
    >
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div
        onMouseDown={onThumbDown}
        className="absolute right-0.5 w-1.5 rounded-full bg-white/40 cursor-pointer transition-opacity duration-200 pointer-events-auto"
        style={{
          top: thumb.top,
          height: thumb.height,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
