import { describe, expect, it } from "vitest";
import {
  adminTransition,
  canAdminTransition,
  canCustomerCancel,
  createBooking,
  createOnsiteCashBooking,
  markPaid,
  expireUnpaidForCar,
  expireAllStaleUnpaid,
  cancelBooking,
  holdCutoff,
} from "@/lib/bookings/lifecycle";
import { createMemoryBookingStore } from "@/lib/bookings/memory-store";
import type { BookingRecord } from "@/lib/bookings/store";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";

const car = {
  id: "car-1",
  name: "Test Car",
  daily_rate_cents: 100_000,
  currency: "PHP",
  is_published: true,
  status: "available",
};

function booking(partial: Partial<BookingRecord> & Pick<BookingRecord, "id">): BookingRecord {
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
    paymongo_checkout_session_id: null,
    created_at: "2026-08-01T10:00:00.000Z",
    ...partial,
  };
}

describe("canCustomerCancel", () => {
  const now = new Date("2026-08-01T12:00:00.000Z");

  it("allows unpaid pending", () => {
    expect(
      canCustomerCancel(
        booking({ id: "1", status: "pending", payment_status: "unpaid" }),
        now
      )
    ).toBe(true);
  });

  it("allows paid confirmed when pickup ≥24h away", () => {
    expect(
      canCustomerCancel(
        booking({
          id: "1",
          status: "confirmed",
          payment_status: "paid",
          pickup_at: "2026-08-10T10:00:00.000Z",
        }),
        now
      )
    ).toBe(true);
  });

  it("blocks paid confirmed when pickup is soon", () => {
    expect(
      canCustomerCancel(
        booking({
          id: "1",
          status: "confirmed",
          payment_status: "paid",
          pickup_at: "2026-08-01T20:00:00.000Z",
        }),
        now
      )
    ).toBe(false);
  });
});

describe("canAdminTransition", () => {
  it("allows pending → confirmed | cancelled", () => {
    expect(canAdminTransition("pending", "confirmed")).toBe(true);
    expect(canAdminTransition("pending", "cancelled")).toBe(true);
    expect(canAdminTransition("pending", "active")).toBe(false);
  });

  it("blocks terminal outbound", () => {
    expect(canAdminTransition("completed", "active")).toBe(false);
    expect(canAdminTransition("cancelled", "pending")).toBe(false);
  });

  it("allows same status (no-op)", () => {
    expect(canAdminTransition("active", "active")).toBe(true);
  });
});

describe("createBooking + expire", () => {
  it("creates pending unpaid after quote", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const store = createMemoryBookingStore({ cars: [car] }, () => now);
    const result = await createBooking(
      store,
      {
        customerId: "user-1",
        carId: "car-1",
        pickupLocationId: "loc-1",
        dropoffLocationId: "loc-1",
        pickupAt: "2026-08-10T10:00:00.000Z",
        dropoffAt: "2026-08-12T10:00:00.000Z",
        driverFullName: "Ada",
        driverPhone: "+63917",
        driverLicenseNumber: "L1",
      },
      now
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalCents).toBe(200_000);
      expect(result.data.rentalDays).toBe(2);
    }
    expect(store.bookings[0]?.payment_status).toBe("unpaid");
    expect(store.bookings[0]?.status).toBe("pending");
  });

  it("createOnsiteCashBooking creates paid confirmed rental", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const store = createMemoryBookingStore({ cars: [car] }, () => now);
    const result = await createOnsiteCashBooking(
      store,
      {
        customerId: "admin-1",
        carId: "car-1",
        pickupLocationId: "loc-1",
        dropoffLocationId: "loc-1",
        pickupAt: "2026-08-10T10:00:00.000Z",
        dropoffAt: "2026-08-12T10:00:00.000Z",
        driverFullName: "Walk In",
        driverPhone: "+639171111111",
        driverLicenseNumber: "CASH1",
        customerNote: "Paid cash at counter",
      },
      now
    );
    expect(result.ok).toBe(true);
    expect(store.bookings[0]?.payment_status).toBe("paid");
    expect(store.bookings[0]?.status).toBe("confirmed");
  });

  it("expires stale unpaid hold then allows rebook", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const staleCreated = holdCutoff(now, CHECKOUT_HOLD_MINUTES);
    staleCreated.setMinutes(staleCreated.getMinutes() - 1);

    const store = createMemoryBookingStore(
      {
        cars: [car],
        bookings: [
          booking({
            id: "old",
            created_at: staleCreated.toISOString(),
            pickup_at: "2026-08-10T10:00:00.000Z",
            dropoff_at: "2026-08-12T10:00:00.000Z",
          }),
        ],
      },
      () => now
    );

    const result = await createBooking(
      store,
      {
        customerId: "user-2",
        carId: "car-1",
        pickupLocationId: "loc-1",
        dropoffLocationId: "loc-1",
        pickupAt: "2026-08-10T10:00:00.000Z",
        dropoffAt: "2026-08-12T10:00:00.000Z",
        driverFullName: "Bob",
        driverPhone: "+63918",
        driverLicenseNumber: "L2",
      },
      now
    );

    expect(result.ok).toBe(true);
    expect(store.bookings.find((b) => b.id === "old")?.payment_status).toBe(
      "expired"
    );
  });
});

describe("markPaid", () => {
  it("sets paid + confirmed", async () => {
    const store = createMemoryBookingStore({
      bookings: [booking({ id: "b1", paymongo_checkout_session_id: "cs_1" })],
    });
    const result = await markPaid(store, {
      checkoutSessionId: "cs_1",
      paymentId: "pay_1",
      amountPaidCents: 200_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.alreadyPaid).toBe(false);
    expect(store.bookings[0]?.status).toBe("confirmed");
    expect(store.bookings[0]?.payment_status).toBe("paid");
  });

  it("refuses cancelled bookings", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          status: "cancelled",
          payment_status: "unpaid",
          paymongo_checkout_session_id: "cs_1",
        }),
      ],
    });
    const result = await markPaid(store, { checkoutSessionId: "cs_1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflict");
  });

  it("refuses expired payment_status", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          payment_status: "expired",
          paymongo_checkout_session_id: "cs_1",
        }),
      ],
    });
    const result = await markPaid(store, { checkoutSessionId: "cs_1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("conflict");
  });

  it("is idempotent when already paid", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          status: "confirmed",
          payment_status: "paid",
          paymongo_checkout_session_id: "cs_1",
        }),
      ],
    });
    const result = await markPaid(store, { checkoutSessionId: "cs_1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.alreadyPaid).toBe(true);
  });
});

describe("adminTransition", () => {
  it("rejects illegal graph edges", async () => {
    const store = createMemoryBookingStore({
      bookings: [booking({ id: "b1", status: "pending" })],
    });
    const result = await adminTransition(store, {
      bookingId: "b1",
      status: "active",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_transition");
  });

  it("allows confirmed → active", async () => {
    const store = createMemoryBookingStore({
      bookings: [
        booking({
          id: "b1",
          status: "confirmed",
          payment_status: "paid",
        }),
      ],
    });
    const result = await adminTransition(store, {
      bookingId: "b1",
      status: "active",
    });
    expect(result.ok).toBe(true);
    expect(store.bookings[0]?.status).toBe("active");
  });
});

describe("cancelBooking", () => {
  it("cancels eligible unpaid", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const store = createMemoryBookingStore({
      bookings: [booking({ id: "b1" })],
    });
    const result = await cancelBooking(
      store,
      { bookingId: "b1", customerId: "user-1" },
      now
    );
    expect(result.ok).toBe(true);
    expect(store.bookings[0]?.status).toBe("cancelled");
  });
});

describe("expireUnpaidForCar", () => {
  it("counts expired rows", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const older = holdCutoff(now);
    older.setUTCMinutes(older.getUTCMinutes() - 5);
    const store = createMemoryBookingStore({
      bookings: [
        booking({ id: "stale", created_at: older.toISOString() }),
        booking({
          id: "fresh",
          created_at: now.toISOString(),
        }),
      ],
    });
    const result = await expireUnpaidForCar(store, "car-1", now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.expired).toBe(1);
  });
});

describe("expireAllStaleUnpaid", () => {
  it("expires stale holds across all cars", async () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const older = holdCutoff(now);
    older.setUTCMinutes(older.getUTCMinutes() - 5);
    const store = createMemoryBookingStore({
      bookings: [
        booking({ id: "stale-a", car_id: "car-1", created_at: older.toISOString() }),
        booking({ id: "stale-b", car_id: "car-2", created_at: older.toISOString() }),
        booking({ id: "fresh", car_id: "car-1", created_at: now.toISOString() }),
        booking({
          id: "paid",
          car_id: "car-2",
          created_at: older.toISOString(),
          payment_status: "paid",
          status: "confirmed",
        }),
      ],
    });
    const result = await expireAllStaleUnpaid(store, now);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.expired).toBe(2);
    expect(store.bookings.find((b) => b.id === "stale-a")?.payment_status).toBe(
      "expired"
    );
    expect(store.bookings.find((b) => b.id === "stale-b")?.payment_status).toBe(
      "expired"
    );
    expect(store.bookings.find((b) => b.id === "fresh")?.payment_status).toBe(
      "unpaid"
    );
    expect(store.bookings.find((b) => b.id === "paid")?.payment_status).toBe(
      "paid"
    );
  });
});
