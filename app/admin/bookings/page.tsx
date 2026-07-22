import Link from "next/link";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminBookings } from "@/lib/admin/queries";
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

  const rows = await listAdminBookings(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
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
            {rows.map((b) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
