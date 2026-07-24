"use client";

import { OpsRule } from "@/components/admin/ops-chrome";
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

/** Live clock for the console chrome. SSR renders a placeholder, never a time. */
export function OpsClock({ className }: { className?: string }) {
  const nowMs = useNowMs(1000);
  const now = nowMs === null ? null : new Date(nowMs);

  return (
    <span
      className={cn(
        "text-muted-foreground text-label flex items-center gap-2 font-mono font-medium tracking-[0.14em] tabular-nums uppercase",
        className
      )}
    >
      {now ? (
        <>
          <span>{dateFormat.format(now)}</span>
          <OpsRule />
        </>
      ) : null}
      <time>{now ? timeFormat.format(now) : "--:--:--"}</time>
    </span>
  );
}
