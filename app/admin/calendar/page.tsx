import { Calendar } from "@/components/admin/calendar/calendar";
import type { CalendarBooking } from "@/lib/admin/calendar-events";
import { listAdminBookings } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Calendar" };

export default async function AdminCalendarPage() {
  const rows = isSupabaseConfigured()
    ? await listAdminBookings({ limit: 200 })
    : [];

  const bookings: CalendarBooking[] = rows.map((b) => ({
    id: b.id,
    reference_code: b.reference_code,
    status: b.status,
    payment_status: b.payment_status,
    pickup_at: b.pickup_at,
    dropoff_at: b.dropoff_at,
    car_name: b.car_name,
  }));

  return (
    <div className="flex flex-col gap-4">
      {!isSupabaseConfigured() ? (
        <p className="text-muted-foreground text-sm">
          Connect Supabase to load bookings on the calendar.
        </p>
      ) : null}
      <Calendar bookings={bookings} />
    </div>
  );
}