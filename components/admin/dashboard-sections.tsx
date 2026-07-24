import Link from "next/link";
import { RevenueAreaChart } from "@/components/admin/charts/revenue-area";
import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import { opsTableHeadClass } from "@/components/admin/ops-chrome";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { StatsTicker } from "@/components/admin/stats-ticker";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { MagicCard } from "@/components/ui/magic-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminDashboardStats,
  getAdminPaidDailySeries,
  listAdminContactMessages,
  listAdminUnpaidPending,
  listAdminUpcomingPickups,
} from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format/date";

/**
 * One async server component per dashboard data concern, so each can sit behind
 * its own Suspense boundary and paint as soon as its query lands.
 *
 * These are siblings, so React invokes all four before any await resolves and
 * the queries still overlap. Splitting the old Promise.all into boundaries does
 * not serialize them.
 */

/** Numbers and sparkline share one boundary: they read as a single band. */
export async function StatsSection({ live }: { live: boolean }) {
  const [stats, series] = await Promise.all([
    getAdminDashboardStats(),
    getAdminPaidDailySeries(14),
  ]);
  return <StatsTicker stats={stats} series={series} live={live} />;
}

export async function RevenueChartSection() {
  const points = await getAdminPaidDailySeries(30);
  const total = points.reduce((sum, p) => sum + p.revenueCents, 0);

  if (total === 0) {
    return (
      <OpsEmptyState
        title="No paid bookings"
        description="Revenue will chart here once bookings start settling."
      />
    );
  }

  return (
    <OpsPanel className="overflow-hidden p-0">
      <MagicCard
        gradientSize={280}
        gradientFrom="oklch(0.65 0 0)"
        gradientTo="oklch(0.45 0 0)"
        gradientColor="oklch(0.5 0 0 / 0.12)"
        gradientOpacity={0.45}
        className="rounded-md p-4"
      >
        <RevenueAreaChart points={points} />
      </MagicCard>
    </OpsPanel>
  );
}

export async function NeedsActionPanel() {
  const rows = await listAdminUnpaidPending(25);
  return <UnpaidBookingsQueue rows={rows} />;
}

export async function UpcomingPickupsPanel() {
  const upcoming = await listAdminUpcomingPickups(10, 7);

  if (upcoming.length === 0) {
    return (
      <OpsEmptyState
        title="Nothing scheduled"
        description="No confirmed or active rentals are due for pickup in the next week."
      />
    );
  }

  return (
    <OpsPanel>
      <Table className="text-ui">
        <TableHeader>
          <TableRow>
            <TableHead className={opsTableHeadClass}>Reference</TableHead>
            <TableHead className={opsTableHeadClass}>Car</TableHead>
            <TableHead className={opsTableHeadClass}>Pickup</TableHead>
            <TableHead className={opsTableHeadClass}>Status</TableHead>
            <TableHead className={opsTableHeadClass}>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcoming.map((b) => (
            <TableRow key={b.id}>
              <TableCell>
                <Link
                  href={`/admin/bookings?booking=${b.id}`}
                  className="font-mono font-medium underline-offset-4 hover:underline"
                >
                  {b.reference_code}
                </Link>
              </TableCell>
              <TableCell>
                {b.car_name ?? <OpsEmptyValue label="No car" />}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatDateTime(b.pickup_at)}
              </TableCell>
              <TableCell>
                <OpsBookingStatusBadge status={b.status} />
              </TableCell>
              <TableCell>
                <OpsPaymentStatusBadge status={b.payment_status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </OpsPanel>
  );
}

export async function InboxPanel() {
  const messages = await listAdminContactMessages(3);

  if (messages.length === 0) {
    return (
      <OpsEmptyState
        title="Inbox empty"
        description="Contact form submissions will appear here."
      />
    );
  }

  return (
    <OpsPanel divided>
      {messages.map((m) => (
        <div key={m.id} className="flex flex-col gap-1.5 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-ui truncate font-medium">{m.name}</span>
              <a
                href={`mailto:${m.email}`}
                className="text-muted-foreground hover:text-foreground truncate font-mono text-xs underline-offset-4 hover:underline"
              >
                {m.email}
              </a>
            </div>
            <time className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
              {formatDateTime(m.created_at)}
            </time>
          </div>
          <p className="text-ui">
            {m.subject ?? <OpsEmptyValue label="No subject" />}
          </p>
          <p className="text-muted-foreground text-ui line-clamp-2">
            {m.message}
          </p>
        </div>
      ))}
    </OpsPanel>
  );
}
