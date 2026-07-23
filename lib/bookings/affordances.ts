import { canCustomerCancel } from "@/lib/bookings/lifecycle";
import { canStartCheckout } from "@/lib/bookings/start-checkout";
import type { BookingRecord } from "@/lib/bookings/store";

export type CustomerBookingAffordances = {
  canPay: boolean;
  canCancel: boolean;
};

/**
 * What a customer may do on a Booking at `now`.
 * Pure composition of checkout + cancel eligibility for presentation.
 * Server actions still enforce the same underlying rules.
 */
export function customerBookingAffordances(
  booking: Pick<
    BookingRecord,
    "status" | "payment_status" | "pickup_at"
  >,
  now: Date = new Date()
): CustomerBookingAffordances {
  return {
    canPay: canStartCheckout(booking),
    canCancel: canCustomerCancel(booking, now),
  };
}
