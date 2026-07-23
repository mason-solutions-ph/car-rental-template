import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import { ReconcilePaymentButton } from "@/components/admin/reconcile-payment-button";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
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
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/bookings">← Bookings</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={currentStatus} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {booking.reference_code}
        </h1>
      </div>
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
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Payment stuck unpaid?</CardTitle>
            <CardDescription>
              Pulls the Checkout Session from PayMongo and marks paid if a
              successful payment exists (same path as the success-page
              reconcile).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReconcilePaymentButton bookingId={booking.id} className="w-fit" />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-0">
          <form
            action={updateAdminBookingStatus}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="id" value={booking.id} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <FormSelect
                  id="status"
                  name="status"
                  defaultValue={booking.status}
                  disabled={statusOptions.length <= 1}
                  options={statusOptions.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
                <FieldDescription>
                  Allowed moves only. Payment status is not changed here.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="adminNote">Admin note</FieldLabel>
                <Textarea
                  id="adminNote"
                  name="adminNote"
                  defaultValue={booking.admin_note ?? ""}
                />
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-fit">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
