import { applyPaidOutcome } from "@/lib/bookings/apply-paid-outcome";
import { createPrivilegedBookingStore } from "@/lib/bookings/privileged-store";
import {
  normalizeWebhookPaidEvent,
  type NormalizedPaidEvent,
} from "@/lib/paymongo/paid-event";
import {
  parsePaymongoEvent,
  verifyPaymongoSignature,
} from "@/lib/paymongo/webhooks";

export type WebhookHandleResult =
  | { ok: true; applied: boolean; paid?: NormalizedPaidEvent }
  | { ok: false; status: number; error: string };

/**
 * Verify signature, normalize paid events, apply mark paid via BookingStore.
 * Non-paid events are acknowledged without applying.
 */
export async function handlePaymongoWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<WebhookHandleResult> {
  const hasSecret = Boolean(process.env.PAYMONGO_WEBHOOK_SECRET);
  const production = process.env.NODE_ENV === "production";

  if (production && !hasSecret) {
    return {
      ok: false,
      status: 500,
      error: "PAYMONGO_WEBHOOK_SECRET is required in production",
    };
  }

  if (!verifyPaymongoSignature(rawBody, signatureHeader)) {
    if (hasSecret) {
      return { ok: false, status: 401, error: "Invalid signature" };
    }
    // Local dev without secret: allow through
  }

  let event;
  try {
    event = parsePaymongoEvent(rawBody);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const paid = normalizeWebhookPaidEvent(event);
  if (!paid) {
    return { ok: true, applied: false };
  }

  const store = createPrivilegedBookingStore();
  const result = await applyPaidOutcome(store, paid);

  if (!result.ok && result.code === "not_found") {
    // Acknowledge so PayMongo does not retry forever for unknown ids
    console.error("webhook paid event for unknown booking", paid);
    return { ok: true, applied: false, paid };
  }

  if (!result.ok && result.code === "conflict") {
    console.error("webhook paid event conflict (cancelled/expired)", paid);
    return { ok: true, applied: false, paid };
  }

  if (!result.ok) {
    console.error("webhook apply paid failed", result);
    return { ok: true, applied: false, paid };
  }

  return { ok: true, applied: true, paid };
}
