import Link from "next/link";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
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
import { parseAdminBookingFilters } from "@/lib/admin/booking-filters";
import {
  listAdminBookings,
  listAdminUnpaidPending,
} from "@/lib/admin/queries";
import {
  BOOKING_STATUSES,
  CHECKOUT_HOLD_MINUTES,
  PAYMENT_STATUSES,
} from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

export const metadata = { title: "Admin bookings" };

type Props = {
  searchParams: Promise<{ status?: string; payment?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to manage bookings.
      </p>
    );
  }

  const sp = await searchParams;
  const filters = parseAdminBookingFilters(sp);
  const hasFilters = Boolean(filters.status || filters.paymentStatus);

  const [rows, unpaidQueue] = await Promise.all([
    listAdminBookings({
      limit: 100,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
    }),
    listAdminUnpaidPending(50),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground text-sm">
          Unpaid holds first, then the full booking list with filters.
        </p>
      </div>

      <section className="flex flex-col gap-3">
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
            Needs payment or reconcile. Checkout hold: {CHECKOUT_HOLD_MINUTES}
            m.
          </p>
        </div>
        <UnpaidBookingsQueue rows={unpaidQueue} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">All bookings</h2>
          {hasFilters ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/bookings">Clear filters</Link>
            </Button>
          ) : null}
        </div>

        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-xl border p-3"
        >
          <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Status</span>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
            >
              <option value="">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Payment</span>
            <select
              name="payment"
              defaultValue={filters.paymentStatus ?? ""}
              className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-sm"
                  >
                    {hasFilters
                      ? "No bookings match these filters."
                      : "No bookings yet."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((b) => (
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
                    <TableCell className="tabular-nums">
                      {formatMoney(b.total_cents)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={b.payment_status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
