import {
  markPaid,
  type LifecycleResult,
  type MarkPaidData,
  type MarkPaidInput,
} from "@/lib/bookings/lifecycle";
import type { BookingStore } from "@/lib/bookings/store";

/**
 * Apply a verified paid Checkout outcome to a Booking (mark paid).
 * Webhook and reconcile adapters only produce MarkPaidInput / NormalizedPaidEvent;
 * this is the single place that applies it through the BookingStore seam.
 */
export async function applyPaidOutcome(
  store: BookingStore,
  paid: MarkPaidInput,
  now: Date = new Date()
): Promise<LifecycleResult<MarkPaidData>> {
  return markPaid(store, paid, now);
}
