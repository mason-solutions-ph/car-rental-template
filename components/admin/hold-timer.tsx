"use client";

import { useNowMs } from "@/components/admin/use-now";
import { holdRemaining } from "@/lib/admin/hold";
import { cn } from "@/lib/utils";

/**
 * Depleting checkout-hold meter. SSR renders an empty track; the bar fills in
 * once the client clock is available.
 */
export function HoldTimer({
  createdAt,
  holdMinutes,
  className,
}: {
  createdAt: string;
  holdMinutes: number;
  className?: string;
}) {
  const nowMs = useNowMs(15_000);

  const remaining =
    nowMs === null ? null : holdRemaining(createdAt, nowMs, holdMinutes);
  const elapsed = remaining !== null && remaining.remainingMs <= 0;

  return (
    <div className={cn("flex min-w-28 flex-col gap-1", className)}>
      <span
        className={cn(
          "font-mono text-[11px] tracking-wider tabular-nums uppercase",
          elapsed ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {remaining ? remaining.label : "--m left"}
      </span>
      <div
        role="progressbar"
        aria-label="Checkout hold remaining"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          remaining ? Math.round(remaining.fraction * 100) : undefined
        }
        className="bg-muted h-1 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-attention h-full rounded-full transition-[width] duration-500"
          style={{ width: `${(remaining?.fraction ?? 0) * 100}%` }}
        />
      </div>
    </div>
  );
}
