import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { reconcileCheckoutPayment } from "@/lib/bookings/reconcile-payment";
import { getMyBooking } from "@/lib/bookings/queries";
import { isSupabaseConfigured } from "@/lib/env";

type Props = {
  searchParams: Promise<{ booking_id?: string }>;
};

export const metadata = { title: "Payment success" };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { booking_id } = await searchParams;
  if (!booking_id || !isSupabaseConfigured()) {
    redirect("/account/bookings");
  }

  const session = await getSessionProfile();
  if (!session)
    redirect(
      `/login?next=/bookings/payment/success?booking_id=${booking_id}`
    );

  const booking = await getMyBooking(session.user.id, booking_id);
  if (!booking) redirect("/account/bookings");

  await reconcileCheckoutPayment({
    bookingId: booking.id,
    paymentStatus: booking.payment_status,
    checkoutSessionId: booking.paymongo_checkout_session_id,
  });

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <FadeIn className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Thanks — payment processing</CardTitle>
            <CardDescription>
              If PayMongo confirmed payment, your booking{" "}
              <strong>{booking.reference_code}</strong> will show as paid and
              confirmed. Webhooks may take a few seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href={`/account/bookings/${booking.id}?paid=1`}>
                View booking
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cars">Browse more cars</Link>
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
