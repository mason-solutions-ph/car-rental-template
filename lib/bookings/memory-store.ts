import { bookingBlocksInventory } from "@/lib/bookings/hold-policy";
import type {
  BookableCar,
  BookingRecord,
  BookingStore,
  BookingUpdatePatch,
  InsertPendingBookingInput,
} from "@/lib/bookings/store";
import type { BookingStatus, PaymentStatus } from "@/types";

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

export type MemoryStoreSeed = {
  cars?: BookableCar[];
  bookings?: BookingRecord[];
};

/** In-memory BookingStore for unit tests. */
export function createMemoryBookingStore(
  seed: MemoryStoreSeed = {},
  clock: () => Date = () => new Date()
): BookingStore & { bookings: BookingRecord[] } {
  const cars = new Map((seed.cars ?? []).map((c) => [c.id, c]));
  const bookings: BookingRecord[] = [...(seed.bookings ?? [])];

  const store: BookingStore & { bookings: BookingRecord[] } = {
    bookings,

    async getBookableCar(carId) {
      return cars.get(carId) ?? null;
    },

    async isCarAvailable({
      carId,
      pickupAt,
      dropoffAt,
      holdMinutes,
      excludeBookingId,
    }) {
      const car = cars.get(carId);
      if (!car || !car.is_published || car.status !== "available") return false;
      const now = clock();
      for (const b of bookings) {
        if (b.car_id !== carId) continue;
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (!overlaps(b.pickup_at, b.dropoff_at, pickupAt, dropoffAt)) continue;
        if (bookingBlocksInventory(b, now, holdMinutes)) return false;
      }
      return true;
    },

    async expireUnpaidForCar(carId, olderThan) {
      let n = 0;
      for (const b of bookings) {
        if (b.car_id !== carId) continue;
        if (b.status !== "pending" || b.payment_status !== "unpaid") continue;
        if (new Date(b.created_at) >= olderThan) continue;
        b.payment_status = "expired";
        n += 1;
      }
      return n;
    },

    async expireAllStaleUnpaid(olderThan) {
      let n = 0;
      for (const b of bookings) {
        if (b.status !== "pending" || b.payment_status !== "unpaid") continue;
        if (new Date(b.created_at) >= olderThan) continue;
        b.payment_status = "expired";
        n += 1;
      }
      return n;
    },

    async insertPending(input: InsertPendingBookingInput) {
      const id = crypto.randomUUID();
      const row: BookingRecord = {
        id,
        reference_code: `REF-${id.slice(0, 8).toUpperCase()}`,
        customer_id: input.customerId,
        car_id: input.carId,
        status: "pending",
        payment_status: "unpaid",
        pickup_at: input.pickupAt,
        dropoff_at: input.dropoffAt,
        total_cents: input.totalCents,
        rental_days: input.rentalDays,
        paymongo_checkout_session_id: null,
        created_at: clock().toISOString(),
      };
      bookings.push(row);
      return {
        ok: true as const,
        booking: {
          id: row.id,
          reference_code: row.reference_code,
          total_cents: row.total_cents,
          rental_days: row.rental_days,
        },
      };
    },

    async getById(id) {
      return bookings.find((b) => b.id === id) ?? null;
    },

    async getByCheckoutSessionId(sessionId) {
      return (
        bookings.find((b) => b.paymongo_checkout_session_id === sessionId) ??
        null
      );
    },

    async update(id, patch: BookingUpdatePatch) {
      const b = bookings.find((x) => x.id === id);
      if (!b) throw new Error("not found");
      if (patch.status !== undefined) b.status = patch.status as BookingStatus;
      if (patch.payment_status !== undefined)
        b.payment_status = patch.payment_status as PaymentStatus;
      if (patch.paymongo_checkout_session_id !== undefined)
        b.paymongo_checkout_session_id = patch.paymongo_checkout_session_id;
    },

    async privilegedUpdate(id, patch) {
      return store.update(id, patch);
    },
  };

  return store;
}
