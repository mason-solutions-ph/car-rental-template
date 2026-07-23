import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import type { BookingStatus, PaymentStatus } from "@/types";

export type AdminBookingFilters = {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
};

function isBookingStatus(v: string): v is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

function isPaymentStatus(v: string): v is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(v);
}

/** Parse URL search params for admin bookings list filters. */
export function parseAdminBookingFilters(sp: {
  status?: string | string[] | undefined;
  payment?: string | string[] | undefined;
}): AdminBookingFilters {
  const rawStatus = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const rawPayment = Array.isArray(sp.payment) ? sp.payment[0] : sp.payment;

  return {
    status:
      rawStatus && isBookingStatus(rawStatus) ? rawStatus : undefined,
    paymentStatus:
      rawPayment && isPaymentStatus(rawPayment) ? rawPayment : undefined,
  };
}

export function adminBookingsFilterQuery(
  filters: AdminBookingFilters
): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentStatus) params.set("payment", filters.paymentStatus);
  const q = params.toString();
  return q ? `?${q}` : "";
}
