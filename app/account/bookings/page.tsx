import Link from "next/link";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/account/booking-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getMyBookings } from "@/lib/bookings/queries";
import { formatMoney } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "My bookings" };

export default async function MyBookingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="text-muted-foreground text-sm">
          Connect Supabase to view bookings. Demo mode has no user data store.
        </p>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/cars">Browse fleet</Link>
        </Button>
      </div>
    );
  }

  const session = await getSessionProfile();
  const bookings = session ? await getMyBookings(session.user.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
      {!bookings.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">No bookings yet</p>
          <Button asChild className="mt-4">
            <Link href="/cars">Browse fleet</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <Link key={b.id} href={`/account/bookings/${b.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base">
                      {b.car?.name ?? "Car"} · {b.reference_code}
                    </CardTitle>
                    <CardDescription>
                      {formatDateTime(b.pickup_at)} → {formatDateTime(b.dropoff_at)}
                    </CardDescription>
                    <p className="text-sm font-medium">
                      {formatMoney(b.total_cents)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BookingStatusBadge status={b.status} />
                    <PaymentStatusBadge status={b.payment_status} />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
