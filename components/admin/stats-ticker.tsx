import Link from "next/link";
import { OpsEyebrow } from "@/components/admin/ops-chrome";
import { RevenueSparkline } from "@/components/admin/revenue-sparkline";
import type { AdminDashboardStats } from "@/lib/admin/queries";
import type { AdminPaidDailyPoint } from "@/lib/admin/revenue-series";
import { formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

function TickerCell({
  label,
  value,
  hint,
  href,
  attention = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  attention?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <OpsEyebrow>{label}</OpsEyebrow>
      <span
        className={cn(
          "font-mono text-xl font-medium tracking-tight tabular-nums",
          attention && "text-attention"
        )}
      >
        {value}
      </span>
      {hint ? (
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
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
    <div className="overflow-hidden rounded-xl border">
      <div className="bg-border grid grid-cols-2 gap-px sm:grid-cols-4 xl:grid-cols-8">
        <TickerCell
          label="Unpaid"
          value={String(stats.unpaidPending)}
          attention={stats.unpaidPending > 0}
          href={live ? "/admin/bookings?status=pending&payment=unpaid" : undefined}
        />
        <TickerCell
          label="Confirmed"
          value={String(stats.confirmed)}
          hint={
            live
              ? `${stats.active} active rental${stats.active === 1 ? "" : "s"}`
              : undefined
          }
          href={live ? "/admin/bookings?status=confirmed" : undefined}
        />
        <TickerCell
          label="Paid 7d"
          value={formatMoney(stats.revenueThisWeekCents)}
          hint={`${stats.paidThisWeek} booking${stats.paidThisWeek === 1 ? "" : "s"}`}
          href={live ? "/admin/bookings?payment=paid" : undefined}
          className="col-span-2"
        />
        <TickerCell
          label="Fleet"
          value={String(stats.publishedCars)}
          href="/admin/cars"
        />
        <TickerCell
          label="Msgs"
          value={String(stats.openMessages)}
          href={live ? "/admin/messages" : undefined}
        />
        <div className="bg-card col-span-2 flex flex-col gap-1 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <OpsEyebrow>Paid · 14d</OpsEyebrow>
            {series.length === 0 ? <OpsEyebrow>No data</OpsEyebrow> : null}
          </div>
          <RevenueSparkline
            points={series}
            className="text-foreground h-8 w-full"
          />
        </div>
      </div>
    </div>
  );
}
