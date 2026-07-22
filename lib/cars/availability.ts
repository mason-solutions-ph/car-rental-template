import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import type { BookingStore } from "@/lib/bookings/store";

/**
 * App seam over inventory availability (SQL `car_is_available` in prod store).
 * Always wires CHECKOUT_HOLD_MINUTES so TS and RPC stay aligned.
 */
export async function isCarAvailableForRange(
  store: BookingStore,
  input: {
    carId: string;
    pickupAt: string;
    dropoffAt: string;
    excludeBookingId?: string | null;
    holdMinutes?: number;
  }
): Promise<boolean> {
  return store.isCarAvailable({
    carId: input.carId,
    pickupAt: input.pickupAt,
    dropoffAt: input.dropoffAt,
    holdMinutes: input.holdMinutes ?? CHECKOUT_HOLD_MINUTES,
    excludeBookingId: input.excludeBookingId,
  });
}
