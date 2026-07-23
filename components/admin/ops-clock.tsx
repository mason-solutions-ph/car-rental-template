"use client";

import { useNowMs } from "@/components/admin/use-now";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const timeFormat = new Intl.DateTimeFormat("en-PH", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Live clock for the ops strip. SSR renders a placeholder, never a time. */
export function OpsClock({ className }: { className?: string }) {
  const nowMs = useNowMs(1000);
  const now = nowMs === null ? null : new Date(nowMs);

  return (
    <span
      className={cn(
        "text-muted-foreground font-mono text-[11px] tracking-wider tabular-nums uppercase",
        className
      )}
    >
      {now ? `${dateFormat.format(now)} · ` : ""}
      <time>{now ? timeFormat.format(now) : "--:--:--"}</time>
    </span>
  );
}
