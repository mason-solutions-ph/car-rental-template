import { BookingsAdmin } from "@/components/admin/bookings-admin";
import { parseAdminBookingFilters } from "@/lib/admin/booking-filters";
import {
  listAdminBookings,
  listAdminUnpaidPending,
} from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin bookings" };

type Props = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    booking?: string;
  }>;
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

  const [rows, unpaidQueue] = await Promise.all([
    listAdminBookings({
      limit: 100,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
    }),
    listAdminUnpaidPending(50),
  ]);

  return (
    <BookingsAdmin
      rows={rows}
      unpaidQueue={unpaidQueue}
      filters={filters}
      initialBookingId={sp.booking ?? null}
    />
  );
}
