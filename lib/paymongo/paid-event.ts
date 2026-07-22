import type { MarkPaidInput } from "@/lib/bookings/lifecycle";
import type {
  PaymongoCheckoutSession,
  PaymongoWebhookEvent,
} from "@/lib/paymongo/types";

export type NormalizedPaidEvent = MarkPaidInput & {
  source: "webhook" | "checkout_session";
};

type ResourceAttrs = {
  payments?: { id?: string; attributes?: { amount?: number } }[];
  payment_intent?: { id?: string };
  metadata?: { booking_id?: string; reference_code?: string };
};

const PAID_EVENT_TYPES = new Set([
  "checkout_session.payment.paid",
  "payment.paid",
]);

/**
 * Map a PayMongo webhook body into a domain MarkPaidInput.
 * Returns null for events that are not payment-paid (caller ignores).
 */
export function normalizeWebhookPaidEvent(
  event: PaymongoWebhookEvent
): NormalizedPaidEvent | null {
  const type = event.data?.attributes?.type;
  if (!type || !PAID_EVENT_TYPES.has(type)) return null;

  const resource = event.data?.attributes?.data;
  const sessionId = resource?.id;
  const attrs = resource?.attributes as ResourceAttrs | undefined;

  const paymentId = attrs?.payments?.[0]?.id;
  const amountPaidCents = attrs?.payments?.[0]?.attributes?.amount;
  const paymentIntentId = attrs?.payment_intent?.id;
  const bookingId = attrs?.metadata?.booking_id;

  if (type === "checkout_session.payment.paid") {
    if (!sessionId && !bookingId) return null;
    return {
      source: "webhook",
      checkoutSessionId: sessionId,
      bookingId,
      paymentId,
      paymentIntentId,
      amountPaidCents,
    };
  }

  // payment.paid — resource id is a payment, not a checkout session
  if (!bookingId && !sessionId) return null;
  return {
    source: "webhook",
    checkoutSessionId: undefined,
    bookingId,
    paymentId: paymentId ?? sessionId,
    paymentIntentId,
    amountPaidCents,
  };
}

/**
 * Map a retrieved Checkout Session into MarkPaidInput when it has payments.
 * Returns null if not yet paid (no payments array).
 */
export function normalizeCheckoutSessionPaid(
  session: PaymongoCheckoutSession
): NormalizedPaidEvent | null {
  const sessionId = session.data.id;
  const attrs = session.data.attributes as ResourceAttrs & {
    payments?: { id?: string; attributes?: { amount?: number } }[];
    metadata?: Record<string, string> | null;
  };

  const payments = attrs.payments;
  if (!payments?.length) return null;

  const first = payments[0] as
    | { id?: string; attributes?: { amount?: number } }
    | undefined;

  return {
    source: "checkout_session",
    checkoutSessionId: sessionId,
    bookingId: attrs.metadata?.booking_id,
    paymentId: first?.id,
    paymentIntentId: undefined,
    amountPaidCents: first?.attributes?.amount,
  };
}
