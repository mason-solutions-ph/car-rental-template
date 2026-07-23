import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import type { BookingRecord } from "@/lib/bookings/store";

/** Booking fields needed to decide inventory / checkout-hold blocking. */
export type HoldPolicyBooking = Pick<
  BookingRecord,
  "status" | "payment_status" | "created_at"
>;

/**
 * Instant before which pending+unpaid holds are stale (eligible to expire).
 * Aligns with SQL: created_at > now() - hold_minutes for active holds.
 */
export function holdCutoff(
  now: Date,
  holdMinutes = CHECKOUT_HOLD_MINUTES
): Date {
  return new Date(now.getTime() - holdMinutes * 60 * 1000);
}

/**
 * Pending + unpaid Booking still within the checkout hold window.
 * Mirrors SQL branch: status pending, payment unpaid, created within hold.
 */
export function isActiveCheckoutHold(
  booking: HoldPolicyBooking,
  now: Date,
  holdMinutes = CHECKOUT_HOLD_MINUTES
): boolean {
  if (booking.status !== "pending" || booking.payment_status !== "unpaid") {
    return false;
  }
  return (
    new Date(booking.created_at).getTime() >
    now.getTime() - holdMinutes * 60 * 1000
  );
}

/**
 * Whether this Booking blocks the car for overlapping date ranges.
 * Contract for memory BookingStore and SQL `car_is_available`:
 * - confirmed or active operational status
 * - pending + paid (rare path; still blocks)
 * - active checkout hold (pending + unpaid within hold window)
 */
export function bookingBlocksInventory(
  booking: HoldPolicyBooking,
  now: Date,
  holdMinutes = CHECKOUT_HOLD_MINUTES
): boolean {
  if (booking.status === "confirmed" || booking.status === "active") {
    return true;
  }
  if (booking.status === "pending" && booking.payment_status === "paid") {
    return true;
  }
  return isActiveCheckoutHold(booking, now, holdMinutes);
}
