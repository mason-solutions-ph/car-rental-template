import { describe, expect, it, vi } from "vitest";
import {
  canStartCheckout,
  startCheckout,
  toStartCheckoutBooking,
} from "@/lib/bookings/start-checkout";
import { createMemoryBookingStore } from "@/lib/bookings/memory-store";
import type { BookingRecord } from "@/lib/bookings/store";

describe("canStartCheckout", () => {
  it("only unpaid pending", () => {
    expect(
      canStartCheckout({ status: "pending", payment_status: "unpaid" })
    ).toBe(true);
    expect(
      canStartCheckout({ status: "confirmed", payment_status: "paid" })
    ).toBe(false);
  });
});

describe("startCheckout", () => {
  it("creates session, attaches id, returns url", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        {
          id: "b1",
          reference_code: "REF1",
          customer_id: "u1",
          car_id: "c1",
          status: "pending",
          payment_status: "unpaid",
          pickup_at: "2026-08-10T10:00:00.000Z",
          dropoff_at: "2026-08-12T10:00:00.000Z",
          total_cents: 100000,
          rental_days: 1,
          paymongo_checkout_session_id: null,
          created_at: "2026-08-01T00:00:00.000Z",
        } satisfies BookingRecord,
      ],
    });

    const createSession = vi.fn(async () => ({
      id: "cs_test",
      checkoutUrl: "https://paymongo.test/cs_test",
    }));

    const result = await startCheckout(
      store,
      {
        bookingId: "b1",
        referenceCode: "REF1",
        totalCents: 100000,
        rentalDays: 1,
        carName: "Vios",
      },
      { createSession, appUrl: "http://localhost:3000" }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkoutUrl).toBe("https://paymongo.test/cs_test");
      expect(result.checkoutSessionId).toBe("cs_test");
    }
    expect(store.bookings[0]?.paymongo_checkout_session_id).toBe("cs_test");
    expect(createSession).toHaveBeenCalledOnce();
  });
});

describe("toStartCheckoutBooking", () => {
  it("maps record fields", () => {
    const b = toStartCheckoutBooking({
      id: "b1",
      reference_code: "R",
      customer_id: "u",
      car_id: "c",
      status: "pending",
      payment_status: "unpaid",
      pickup_at: "",
      dropoff_at: "",
      total_cents: 50,
      rental_days: 2,
      paymongo_checkout_session_id: null,
      created_at: "",
      car_name: "Camry",
    });
    expect(b.carName).toBe("Camry");
    expect(b.bookingId).toBe("b1");
  });
});
