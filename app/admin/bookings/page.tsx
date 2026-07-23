import Link from "next/link";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminBookings,
  listAdminUnpaidPending,
} from "@/lib/admin/queries";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

export const metadata = { title: "Admin bookings" };

export default async function AdminBookingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to manage bookings.
      </p>
    );
  }

  const [rows, unpaidQueue] = await Promise.all([
    listAdminBookings(100),
    listAdminUnpaidPending(50),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>

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
        <h2 className="text-lg font-semibold tracking-tight">All bookings</h2>
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
                    No bookings yet.
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
                    <TableCell>{formatMoney(b.total_cents)}</TableCell>
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
