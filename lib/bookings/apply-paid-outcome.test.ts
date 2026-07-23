import { describe, expect, it } from "vitest";
import { applyPaidOutcome } from "@/lib/bookings/apply-paid-outcome";
import { createMemoryBookingStore } from "@/lib/bookings/memory-store";
import type { BookingRecord } from "@/lib/bookings/store";

function booking(
  partial: Partial<BookingRecord> & Pick<BookingRecord, "id">
): BookingRecord {
  return {
    reference_code: "REF",
    customer_id: "user-1",
    car_id: "car-1",
    status: "pending",
    payment_status: "unpaid",
    pickup_at: "2026-08-10T10:00:00.000Z",
    dropoff_at: "2026-08-12T10:00:00.000Z",
    total_cents: 200_000,
    rental_days: 2,
    paymongo_checkout_session_id: "cs_1",
    created_at: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

describe("applyPaidOutcome", () => {
  const now = new Date("2026-08-01T12:00:00.000Z");

  it("marks unpaid pending paid via checkout session", async () => {
    const store = createMemoryBookingStore({
      bookings: [booking({ id: "b1" })],
    });
    const result = await applyPaidOutcome(
      store,
      {
        checkoutSessionId: "cs_1",
        paymentId: "pay_1",
        amountPaidCents: 200_000,
      },
      now
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.alreadyPaid).toBe(false);
      expect(result.data.bookingId).toBe("b1");
    }
    expect(store.bookings[0]?.payment_status).toBe("paid");
    expect(store.bookings[0]?.status).toBe("confirmed");
  });

  it("is idempotent when already paid", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          status: "confirmed",
          payment_status: "paid",
        }),
      ],
    });
    const result = await applyPaidOutcome(
      store,
      { checkoutSessionId: "cs_1" },
      now
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.alreadyPaid).toBe(true);
  });

  it("refuses cancelled", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          status: "cancelled",
          payment_status: "unpaid",
        }),
      ],
    });
    const result = await applyPaidOutcome(
      store,
      { checkoutSessionId: "cs_1" },
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflict");
  });

  it("refuses expired", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          payment_status: "expired",
        }),
      ],
    });
    const result = await applyPaidOutcome(
      store,
      { checkoutSessionId: "cs_1" },
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflict");
  });

  it("not_found for unknown session", async () => {
    const store = createMemoryBookingStore({ bookings: [] });
    const result = await applyPaidOutcome(
      store,
      { checkoutSessionId: "cs_missing" },
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_found");
  });
});
