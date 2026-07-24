"use client";

import Link from "next/link";
import { OpsEyebrow } from "@/components/admin/ops-chrome";
import { OpsPanel } from "@/components/admin/ops-panel";
import { RevenueSparkline } from "@/components/admin/revenue-sparkline";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShineBorder } from "@/components/ui/shine-border";
import type { AdminDashboardStats } from "@/lib/admin/queries";
import type { AdminPaidDailyPoint } from "@/lib/admin/revenue-series";
import { formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

function TickerCell({
  label,
  value,
  numericValue,
  hint,
  href,
  attention = false,
  className,
}: {
  label: string;
  /** Static display (money, or fallback). Used when numericValue is omitted. */
  value?: string;
  /** When set, animates with NumberTicker instead of rendering value. */
  numericValue?: number;
  hint?: string;
  href?: string;
  attention?: boolean;
  className?: string;
}) {
  const valueClass = cn(
    "font-mono text-xl font-medium tracking-tight tabular-nums",
    attention && "text-attention"
  );

  const body = (
    <>
      <OpsEyebrow>{label}</OpsEyebrow>
      {numericValue !== undefined ? (
        <NumberTicker
          value={numericValue}
          className={cn(valueClass, "text-foreground dark:text-foreground")}
        />
      ) : (
        <span className={valueClass}>{value}</span>
      )}
      {hint ? (
        <span className="text-muted-foreground text-label font-mono tabular-nums">
          {hint}
        </span>
      ) : null}
    </>
  );
  const cellClass = cn("bg-card flex flex-col gap-1 px-4 py-3", className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cellClass,
          "hover:bg-muted/40 focus-visible:ring-ring/50 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={cellClass}>{body}</div>;
}

/** Single-band replacement for the stat-card grid: mono figures, hairline splits. */
export function StatsTicker({
  stats,
  series,
  live,
}: {
  stats: AdminDashboardStats;
  series: AdminPaidDailyPoint[];
  live: boolean;
}) {
  return (
    <OpsPanel className="bg-transparent">
      <div className="bg-border grid grid-cols-2 gap-px sm:grid-cols-4 xl:grid-cols-8">
        <TickerCell
          label="Unpaid"
          numericValue={stats.unpaidPending}
          attention={stats.unpaidPending > 0}
          href={
            live ? "/admin/bookings?status=pending&payment=unpaid" : undefined
          }
        />
        <TickerCell
          label="Confirmed"
          numericValue={stats.confirmed}
          hint={
            live
              ? `${stats.active} active rental${stats.active === 1 ? "" : "s"}`
              : undefined
          }
          href={live ? "/admin/bookings?status=confirmed" : undefined}
        />
        {/* Money stays formatted: NumberTicker has no currency symbol. */}
        <TickerCell
          label="Revenue 7d"
          value={formatMoney(stats.revenueThisWeekCents)}
          hint={`${stats.paidThisWeek} booking${stats.paidThisWeek === 1 ? "" : "s"}`}
          href={live ? "/admin/bookings?payment=paid" : undefined}
          className="col-span-2"
        />
        <TickerCell
          label="Fleet"
          numericValue={stats.publishedCars}
          href="/admin/cars"
        />
        <TickerCell
          label="Msgs"
          numericValue={stats.openMessages}
          href={live ? "/admin/messages" : undefined}
        />
        <div className="bg-card relative col-span-2 flex flex-col gap-1 overflow-hidden px-4 py-3">
          <ShineBorder
            borderWidth={1}
            duration={12}
            shineColor={["var(--border)", "var(--foreground-subtle)", "var(--border)"]}
          />
          <div className="relative z-10 flex items-baseline justify-between gap-2">
            <OpsEyebrow>Trend</OpsEyebrow>
            <OpsEyebrow>{series.length === 0 ? "No data" : "14D"}</OpsEyebrow>
          </div>
          <RevenueSparkline
            points={series}
            className="text-foreground relative z-10 h-8 w-full"
          />
        </div>
      </div>
    </OpsPanel>
  );
}
