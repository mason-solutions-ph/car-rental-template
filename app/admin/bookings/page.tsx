import { BookingsAdmin } from "@/components/admin/bookings-admin";
import { parseAdminBookingFilters } from "@/lib/admin/booking-filters";
import {
  listAdminBookings,
  listAdminCars,
  listAdminUnpaidPending,
} from "@/lib/admin/queries";
import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin bookings" };

type Props = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    booking?: string;
    new?: string;
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
  const fleet = await getFleetRepo();

  const [rows, unpaidQueue, cars, locations] = await Promise.all([
    listAdminBookings({
      limit: 100,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
    }),
    listAdminUnpaidPending(50),
    listAdminCars(),
    fleet.listAllLocations(),
  ]);

  const location = locations[0] ?? null;

  return (
    <BookingsAdmin
      rows={rows}
      unpaidQueue={unpaidQueue}
      filters={filters}
      initialBookingId={sp.booking ?? null}
      openOnsiteOnMount={sp.new === "1" || sp.new === "true"}
      onsiteCars={cars.map((c) => ({
        id: c.id,
        name: c.name,
        daily_rate_cents: c.daily_rate_cents,
        is_published: c.is_published,
        status: c.status,
      }))}
      onsiteLocationId={location?.id ?? ""}
      onsiteLocationName={location?.name ?? "No location configured"}
    />
  );
}
