import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cancelBooking, retryCheckout } from "@/app/actions/bookings";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getMyBooking } from "@/lib/bookings/queries";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { isSupabaseConfigured } from "@/lib/env";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string; paid?: string }>;
};

export const metadata = { title: "Booking detail" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to view booking details.
      </p>
    );
  }

  const session = await getSessionProfile();
  if (!session) notFound();

  const booking = await getMyBooking(session.user.id, id);
  if (!booking) notFound();

  const unpaid =
    booking.payment_status === "unpaid" && booking.status === "pending";

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.payment_status} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {booking.reference_code}
        </h1>
        {sp.demo ? (
          <p className="text-muted-foreground text-sm">
            Demo: booking saved without PayMongo (secret key missing).
          </p>
        ) : null}
        {sp.paid ? (
          <p className="text-sm text-green-700 dark:text-green-400">
            Payment received — your booking is confirmed.
          </p>
        ) : null}
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
          <p>
            Pickup: {booking.pickup_location?.name},{" "}
            {booking.pickup_location?.city}
          </p>
          <p>
            Drop-off: {booking.dropoff_location?.name},{" "}
            {booking.dropoff_location?.city}
          </p>
          <p>
            Total:{" "}
            <span className="font-semibold">
              {formatMoney(booking.total_cents)}
            </span>{" "}
            ({booking.rental_days} day
            {booking.rental_days === 1 ? "" : "s"})
          </p>
          {booking.driver_full_name ? (
            <p>Driver: {booking.driver_full_name}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {unpaid ? (
          <form
            action={async () => {
              "use server";
              await retryCheckout(booking.id);
            }}
          >
            <Button type="submit">Pay now</Button>
          </form>
        ) : null}
        {(unpaid ||
          (booking.payment_status === "paid" &&
            booking.status === "confirmed")) && (
          <form
            action={async () => {
              "use server";
              await cancelBooking(booking.id);
            }}
          >
            <Button type="submit" variant="outline">
              Cancel booking
            </Button>
          </form>
        )}
        <Button asChild variant="ghost">
          <Link href="/account/bookings">All bookings</Link>
        </Button>
      </div>
    </div>
  );
}
