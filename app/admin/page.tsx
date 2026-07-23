import Link from "next/link";
import { ExpireHoldsButton } from "@/components/admin/expire-holds-button";
import { OpsEyebrow, OpsPageHeader, OpsSectionHeader } from "@/components/admin/ops-chrome";
import {
  OpsBookingStatusBadge,
  OpsPaymentStatusBadge,
} from "@/components/admin/ops-status-badge";
import { StatsTicker } from "@/components/admin/stats-ticker";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { Button } from "@/components/ui/button";
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
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format/date";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin" };

const headClass =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const live = isSupabaseConfigured() && !stats.demo;

  const [unpaidQueue, upcoming, recentMessages, series] = live
    ? await Promise.all([
        listAdminUnpaidPending(25),
        listAdminUpcomingPickups(10, 7),
        listAdminContactMessages(3),
        getAdminPaidDailySeries(14),
      ])
    : [[], [], [], []];

  return (
    <div className="flex flex-col gap-8">
      <OpsPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={
          stats.demo
            ? "Demo stats from local fleet data. Connect Supabase for live bookings."
            : "Operational overview for fleet and bookings."
        }
        actions={
          live ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin/cars/new">Add car</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/bookings">All bookings</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/messages">Messages</Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <StatsTicker stats={stats} series={series} live={live} />

      {live ? (
        <>
          <section className="flex flex-col gap-3">
            <OpsSectionHeader
              eyebrow="Needs action"
              tone="attention"
              count={unpaidQueue.length}
              description={`Pending checkouts still unpaid. Hold is ${CHECKOUT_HOLD_MINUTES} minutes. Reconcile when a webhook lags.`}
              actions={
                <>
                  <ExpireHoldsButton />
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/bookings?status=pending&payment=unpaid">
                      View all
                    </Link>
                  </Button>
                </>
              }
            />
            <UnpaidBookingsQueue rows={unpaidQueue} />
          </section>

          <section className="flex flex-col gap-3">
            <OpsSectionHeader
              eyebrow="Pickups · next 7 days"
              description="Confirmed or active rentals due for pickup."
            />
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming pickups in the next week.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={headClass}>Reference</TableHead>
                      <TableHead className={headClass}>Car</TableHead>
                      <TableHead className={headClass}>Pickup</TableHead>
                      <TableHead className={headClass}>Status</TableHead>
                      <TableHead className={headClass}>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="font-mono text-[13px] font-medium underline-offset-4 hover:underline"
                          >
                            {b.reference_code}
                          </Link>
                        </TableCell>
                        <TableCell>{b.car_name ?? "—"}</TableCell>
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
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <OpsSectionHeader
              eyebrow="Inbox"
              count={stats.openMessages}
              description="Latest contact form submissions."
              actions={
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/messages">All messages</Link>
                </Button>
              }
            />
            {recentMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {formatDateTime(m.created_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {m.subject ?? "No subject"} · {m.email}
                    </p>
                    <p className="line-clamp-2 text-sm">{m.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl border border-dashed p-6">
          <OpsEyebrow>Demo mode</OpsEyebrow>
          <p className="text-sm font-medium">Live bookings need Supabase</p>
          <p className="text-muted-foreground text-sm">
            Fleet KPIs above use demo data. Connect a project and run
            migrations to unlock the unpaid queue, pickups, and messages.
          </p>
        </div>
      )}
    </div>
  );
}
