import { markBookingPaid } from "@/lib/bookings/mark-paid";
import {
  isPaymongoConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { retrieveCheckoutSession } from "@/lib/paymongo/checkout";
import { normalizeCheckoutSessionPaid } from "@/lib/paymongo/paid-event";

export type ReconcileInput = {
  bookingId: string;
  paymentStatus: string;
  checkoutSessionId: string | null;
};

/**
 * If webhook is slow, pull Checkout Session from PayMongo and apply mark-paid
 * when payments exist. No-op when already paid or keys missing.
 */
export async function reconcileCheckoutPayment(
  booking: ReconcileInput
): Promise<{ reconciled: boolean; reason?: string }> {
  if (booking.paymentStatus === "paid") {
    return { reconciled: false, reason: "already_paid" };
  }
  if (!booking.checkoutSessionId) {
    return { reconciled: false, reason: "no_session" };
  }
  if (
    !isSupabaseConfigured() ||
    !isPaymongoConfigured() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { reconciled: false, reason: "not_configured" };
  }

  try {
    const session = await retrieveCheckoutSession(booking.checkoutSessionId);
    const paid = normalizeCheckoutSessionPaid(session);
    if (!paid) {
      return { reconciled: false, reason: "not_paid_yet" };
    }

    const result = await markBookingPaid({
      checkoutSessionId: paid.checkoutSessionId ?? booking.checkoutSessionId,
      bookingId: paid.bookingId ?? booking.bookingId,
      paymentId: paid.paymentId,
      paymentIntentId: paid.paymentIntentId,
      amountPaidCents: paid.amountPaidCents,
    });

    if (!result.ok) {
      return { reconciled: false, reason: result.reason };
    }
    return { reconciled: !result.alreadyPaid };
  } catch (e) {
    console.error("reconcileCheckoutPayment failed", e);
    return { reconciled: false, reason: "error" };
  }
}
