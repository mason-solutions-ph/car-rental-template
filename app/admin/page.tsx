import Link from "next/link";
import { ExpireHoldsButton } from "@/components/admin/expire-holds-button";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { AdminStatCard } from "@/components/admin/stat-card";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
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
  listAdminContactMessages,
  listAdminUnpaidPending,
  listAdminUpcomingPickups,
} from "@/lib/admin/queries";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const live = isSupabaseConfigured() && !stats.demo;

  const [unpaidQueue, upcoming, recentMessages] = live
    ? await Promise.all([
        listAdminUnpaidPending(25),
        listAdminUpcomingPickups(10, 7),
        listAdminContactMessages(3),
      ])
    : [[], [], []];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {stats.demo
              ? "Demo stats from local fleet data. Connect Supabase for live bookings."
              : "Operational overview for fleet and bookings."}
          </p>
        </div>
        {live ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/cars/new">Add car</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/bookings">All bookings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/messages">Messages</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Unpaid pending"
          value={String(stats.unpaidPending)}
          hint={live ? "Checkout holds still open" : undefined}
          href={
            live
              ? "/admin/bookings?status=pending&payment=unpaid"
              : undefined
          }
        />
        <AdminStatCard
          label="Confirmed"
          value={String(stats.confirmed)}
          hint={
            live && stats.active
              ? `${stats.active} active rental${stats.active === 1 ? "" : "s"}`
              : live
                ? "Paid, not yet active"
                : undefined
          }
          href={live ? "/admin/bookings?status=confirmed" : undefined}
        />
        <AdminStatCard
          label="Paid this week"
          value={String(stats.paidThisWeek)}
          hint={
            live
              ? formatMoney(stats.revenueThisWeekCents)
              : undefined
          }
          href={live ? "/admin/bookings?payment=paid" : undefined}
        />
        <AdminStatCard
          label="Published cars"
          value={String(stats.publishedCars)}
          href="/admin/cars"
        />
      </div>

      {live ? (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Unpaid queue
                  {unpaidQueue.length ? (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      ({unpaidQueue.length})
                    </span>
                  ) : null}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Pending checkouts still unpaid. Hold is{" "}
                  {CHECKOUT_HOLD_MINUTES} minutes. Reconcile when a webhook
                  lags.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExpireHoldsButton />
                <Button asChild size="sm" variant="secondary">
                  <Link href="/admin/bookings?status=pending&payment=unpaid">
                    View all
                  </Link>
                </Button>
              </div>
            </div>
            <UnpaidBookingsQueue rows={unpaidQueue} />
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Upcoming pickups
              </h2>
              <p className="text-muted-foreground text-sm">
                Confirmed or active rentals in the next 7 days.
              </p>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming pickups in the next week.
              </p>
            ) : (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Car</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link
                            href={`/admin/bookings/${b.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {b.reference_code}
                          </Link>
                        </TableCell>
                        <TableCell>{b.car_name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDateTime(b.pickup_at)}
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} />
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={b.payment_status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Recent messages
                  {stats.openMessages ? (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      ({stats.openMessages} total)
                    </span>
                  ) : null}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Latest contact form submissions.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/messages">All messages</Link>
              </Button>
            </div>
            {recentMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground text-xs">
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
        <div className="rounded-xl border border-dashed p-6">
          <p className="text-sm font-medium">Live bookings need Supabase</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Fleet KPIs above use demo data. Connect a project and run
            migrations to unlock the unpaid queue, pickups, and messages.
          </p>
        </div>
      )}
    </div>
  );
}
