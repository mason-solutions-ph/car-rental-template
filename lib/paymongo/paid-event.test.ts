import { describe, expect, it } from "vitest";
import {
  normalizeCheckoutSessionPaid,
  normalizeWebhookPaidEvent,
} from "@/lib/paymongo/paid-event";
import type {
  PaymongoCheckoutSession,
  PaymongoWebhookEvent,
} from "@/lib/paymongo/types";

describe("normalizeWebhookPaidEvent", () => {
  it("maps checkout_session.payment.paid", () => {
    const event: PaymongoWebhookEvent = {
      data: {
        id: "evt_1",
        type: "event",
        attributes: {
          type: "checkout_session.payment.paid",
          data: {
            id: "cs_abc",
            type: "checkout_session",
            attributes: {
              payments: [
                { id: "pay_1", attributes: { amount: 250000 } },
              ],
              payment_intent: { id: "pi_1" },
              metadata: { booking_id: "book-1" },
            },
          },
        },
      },
    };

    const paid = normalizeWebhookPaidEvent(event);
    expect(paid).toEqual({
      source: "webhook",
      checkoutSessionId: "cs_abc",
      bookingId: "book-1",
      paymentId: "pay_1",
      paymentIntentId: "pi_1",
      amountPaidCents: 250000,
    });
  });

  it("returns null for unrelated events", () => {
    const event: PaymongoWebhookEvent = {
      data: {
        id: "evt_1",
        type: "event",
        attributes: {
          type: "checkout_session.payment.failed",
          data: { id: "cs_x" },
        },
      },
    };
    expect(normalizeWebhookPaidEvent(event)).toBeNull();
  });

  it("maps payment.paid using booking metadata, not payment id as session", () => {
    const event: PaymongoWebhookEvent = {
      data: {
        id: "evt_2",
        type: "event",
        attributes: {
          type: "payment.paid",
          data: {
            id: "pay_abc",
            type: "payment",
            attributes: {
              amount: 440000,
              metadata: { booking_id: "book-99" },
            },
          },
        },
      },
    };
    const paid = normalizeWebhookPaidEvent(event);
    expect(paid?.checkoutSessionId).toBeUndefined();
    expect(paid?.bookingId).toBe("book-99");
    expect(paid?.paymentId).toBe("pay_abc");
  });
});

describe("normalizeCheckoutSessionPaid", () => {
  it("returns null when no payments", () => {
    const session: PaymongoCheckoutSession = {
      data: {
        id: "cs_1",
        type: "checkout_session",
        attributes: {
          checkout_url: "https://example.com",
          payments: [],
          metadata: { booking_id: "b1" },
        },
      },
    };
    expect(normalizeCheckoutSessionPaid(session)).toBeNull();
  });

  it("maps session with payments", () => {
    const session: PaymongoCheckoutSession = {
      data: {
        id: "cs_1",
        type: "checkout_session",
        attributes: {
          checkout_url: "https://example.com",
          payments: [{ id: "pay_9", attributes: { amount: 100 } }] as never,
          metadata: { booking_id: "b1" },
        },
      },
    };
    const paid = normalizeCheckoutSessionPaid(session);
    expect(paid?.checkoutSessionId).toBe("cs_1");
    expect(paid?.bookingId).toBe("b1");
    expect(paid?.paymentId).toBe("pay_9");
  });
});
