import { notFound } from "next/navigation";

import { BookingDetail } from "@/components/admin/booking-detail";
import { getAdminBookingById } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const booking = isSupabaseConfigured()
    ? await getAdminBookingById(id)
    : null;
  return {
    title: booking
      ? `Booking ${booking.reference_code}`
      : "Booking",
  };
}

export default async function AdminBookingDetailPage({ params }: Props) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to view bookings.
      </p>
    );
  }

  const { id } = await params;
  const booking = await getAdminBookingById(id);
  if (!booking) notFound();

  return <BookingDetail booking={booking} />;
}
