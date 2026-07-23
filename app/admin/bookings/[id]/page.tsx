import { notFound } from "next/navigation";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateAdminBookingStatus } from "@/app/actions/admin-bookings";
import { getAdminBookingById } from "@/lib/admin/queries";
import { canAdminTransition } from "@/lib/bookings/lifecycle";
import { BOOKING_STATUSES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import type { BookingStatus } from "@/types";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Admin booking" };

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">Connect Supabase first.</p>
    );
  }

  const booking = await getAdminBookingById(id);
  if (!booking) notFound();

  const currentStatus = booking.status as BookingStatus;
  const statusOptions = BOOKING_STATUSES.filter((s) =>
    canAdminTransition(currentStatus, s)
  );
  const showReconcile =
    booking.payment_status === "unpaid" &&
    booking.status === "pending" &&
    Boolean(booking.paymongo_checkout_session_id);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <BookingStatusBadge status={currentStatus} />
        <PaymentStatusBadge status={booking.payment_status} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {booking.reference_code}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{booking.car?.name}</CardTitle>
          <CardDescription>
            {formatDateTime(booking.pickup_at)} →{" "}
            {formatDateTime(booking.dropoff_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>Total: {formatMoney(booking.total_cents)}</p>
          <p className="text-muted-foreground break-all">
            PayMongo session: {booking.paymongo_checkout_session_id ?? "—"}
          </p>
          <p className="text-muted-foreground break-all">
            Payment id: {booking.paymongo_payment_id ?? "—"}
          </p>
        </CardContent>
      </Card>

      {showReconcile ? (
        <div className="flex flex-col gap-2 rounded-xl border p-4">
          <p className="text-sm font-medium">Payment stuck unpaid?</p>
          <p className="text-muted-foreground text-xs">
            Pulls the Checkout Session from PayMongo and marks paid if a
            successful payment exists (same path as the success-page reconcile).
          </p>
          <ReconcilePaymentButton bookingId={booking.id} className="w-fit" />
        </div>
      ) : null}

      <form
        action={updateAdminBookingStatus}
        className="flex flex-col gap-3 rounded-xl border p-4"
      >
        <input type="hidden" name="id" value={booking.id} />
        <label className="flex flex-col gap-1.5 text-sm">
          Status
          <select
            name="status"
            defaultValue={booking.status}
            className="border-input bg-background h-8 rounded-lg border px-2.5"
            disabled={statusOptions.length <= 1}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <p className="text-muted-foreground text-xs">
          Allowed moves only. Payment status is not changed here.
        </p>
        <label className="flex flex-col gap-1.5 text-sm">
          Admin note
          <textarea
            name="adminNote"
            defaultValue={booking.admin_note ?? ""}
            className="border-input bg-background min-h-20 rounded-lg border px-2.5 py-2"
          />
        </label>
        <Button type="submit" className="w-fit">
          Save
        </Button>
      </form>
    </div>
  );
}
