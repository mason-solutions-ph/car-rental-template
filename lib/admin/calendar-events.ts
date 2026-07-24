import type { BookingStatus, PaymentStatus } from "@/types";

export type CalendarBooking = {
  id: string;
  reference_code: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  pickup_at: string;
  dropoff_at: string;
  car_name: string | null;
};

export type CalendarFilter =
  | "all"
  | "pickups"
  | "dropoffs"
  | "active"
  | "unpaid"
  | "cancelled";

export type AdminCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  url?: string;
  color?: string;
  extendedProps: {
    bookingId: string;
    reference_code: string;
    status: BookingStatus;
    payment_status: PaymentStatus;
    kind: "rental" | "pickup" | "dropoff";
    car_name: string | null;
  };
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending: "var(--attention)",
  confirmed: "var(--primary)",
  active: "var(--chart-2)",
  completed: "var(--muted-foreground)",
  cancelled: "var(--destructive)",
};

function carLabel(b: CalendarBooking) {
  return b.car_name?.trim() || "Vehicle";
}

export function eventsForFilter(
  bookings: CalendarBooking[],
  filter: CalendarFilter,
): AdminCalendarEvent[] {
  let list = bookings;
  if (filter === "all" || filter === "pickups" || filter === "dropoffs") {
    list = bookings.filter((b) => b.status !== "cancelled");
  } else if (filter === "active") {
    list = bookings.filter((b) => b.status === "confirmed" || b.status === "active");
  } else if (filter === "unpaid") {
    list = bookings.filter(
      (b) => b.payment_status === "unpaid" && b.status !== "cancelled" && b.status !== "completed",
    );
  } else if (filter === "cancelled") {
    list = bookings.filter((b) => b.status === "cancelled");
  }

  const mode =
    filter === "pickups" ? "pickup" : filter === "dropoffs" ? "dropoff" : "rental";

  return list.map((booking) => {
    const color = STATUS_COLOR[booking.status] ?? "var(--primary)";
    const url = `/admin/bookings?booking=${encodeURIComponent(booking.id)}`;
    const base = {
      color,
      url,
      extendedProps: {
        bookingId: booking.id,
        reference_code: booking.reference_code,
        status: booking.status,
        payment_status: booking.payment_status,
        car_name: booking.car_name,
      },
    };
    if (mode === "pickup") {
      return {
        id: `pickup-${booking.id}`,
        title: `Pickup · ${carLabel(booking)} · ${booking.reference_code}`,
        start: booking.pickup_at,
        ...base,
        extendedProps: { ...base.extendedProps, kind: "pickup" as const },
      };
    }
    if (mode === "dropoff") {
      return {
        id: `dropoff-${booking.id}`,
        title: `Drop-off · ${carLabel(booking)} · ${booking.reference_code}`,
        start: booking.dropoff_at,
        ...base,
        extendedProps: { ...base.extendedProps, kind: "dropoff" as const },
      };
    }
    return {
      id: `rental-${booking.id}`,
      title: `${carLabel(booking)} · ${booking.reference_code}`,
      start: booking.pickup_at,
      end: booking.dropoff_at,
      ...base,
      extendedProps: { ...base.extendedProps, kind: "rental" as const },
    };
  });
}

export function countEventsInRange(
  events: AdminCalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return events.filter((event) => {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : start;
    return start < rangeEnd && end >= rangeStart;
  }).length;
}