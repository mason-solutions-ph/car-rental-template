import {
  CANCEL_MIN_HOURS_BEFORE_PICKUP,
  CHECKOUT_HOLD_MINUTES,
} from "@/lib/constants";
import { isCarAvailableForRange } from "@/lib/cars/availability";
import { quoteRental } from "@/lib/cars/pricing";
import type { BookingStatus, PaymentStatus } from "@/types";
import type {
  BookingRecord,
  BookingStore,
  InsertPendingBookingInput,
} from "@/lib/bookings/store";

export type LifecycleResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type CreateBookingIntent = {
  customerId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupAt: string;
  dropoffAt: string;
  driverFullName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  customerNote?: string | null;
};

export type CreateBookingResult = {
  bookingId: string;
  referenceCode: string;
  totalCents: number;
  rentalDays: number;
  carName: string;
};

const TERMINAL: ReadonlySet<BookingStatus> = new Set([
  "completed",
  "cancelled",
]);

/** Admin operational transitions (payment_status is never set here). */
const ADMIN_EDGES: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL.has(status);
}

export function canAdminTransition(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  if (from === to) return true;
  return (ADMIN_EDGES[from] ?? []).includes(to);
}

export function canCustomerCancel(
  booking: Pick<
    BookingRecord,
    "status" | "payment_status" | "pickup_at"
  >,
  now: Date
): boolean {
  if (
    booking.payment_status === "unpaid" &&
    booking.status === "pending"
  ) {
    return true;
  }

  if (
    booking.payment_status === "paid" &&
    booking.status === "confirmed"
  ) {
    const hoursToPickup =
      (new Date(booking.pickup_at).getTime() - now.getTime()) /
      (1000 * 60 * 60);
    return hoursToPickup >= CANCEL_MIN_HOURS_BEFORE_PICKUP;
  }

  return false;
}

export function holdCutoff(now: Date, holdMinutes = CHECKOUT_HOLD_MINUTES): Date {
  return new Date(now.getTime() - holdMinutes * 60 * 1000);
}

/**
 * Full create pipeline: expire stale holds for car → bookable check →
 * availability → quote → insert pending/unpaid.
 */
export async function createBooking(
  store: BookingStore,
  intent: CreateBookingIntent,
  now: Date = new Date()
): Promise<LifecycleResult<CreateBookingResult>> {
  const car = await store.getBookableCar(intent.carId);
  if (!car || !car.is_published || car.status !== "available") {
    return { ok: false, error: "This car is not available to book." };
  }

  await store.expireUnpaidForCar(
    intent.carId,
    holdCutoff(now, CHECKOUT_HOLD_MINUTES)
  );

  const available = await isCarAvailableForRange(store, {
    carId: intent.carId,
    pickupAt: intent.pickupAt,
    dropoffAt: intent.dropoffAt,
  });
  if (!available) {
    return { ok: false, error: "Those dates are not available for this car." };
  }

  const quote = quoteRental(
    car.daily_rate_cents,
    new Date(intent.pickupAt),
    new Date(intent.dropoffAt)
  );
  if (!quote.ok) {
    return { ok: false, error: quote.error };
  }

  const insert: InsertPendingBookingInput = {
    customerId: intent.customerId,
    carId: intent.carId,
    pickupLocationId: intent.pickupLocationId,
    dropoffLocationId: intent.dropoffLocationId,
    pickupAt: intent.pickupAt,
    dropoffAt: intent.dropoffAt,
    dailyRateCents: car.daily_rate_cents,
    rentalDays: quote.rentalDays,
    subtotalCents: quote.subtotalCents,
    feesCents: quote.feesCents,
    totalCents: quote.totalCents,
    driverFullName: intent.driverFullName,
    driverPhone: intent.driverPhone,
    driverLicenseNumber: intent.driverLicenseNumber,
    customerNote: intent.customerNote ?? null,
  };

  const created = await store.insertPending(insert);
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  return {
    ok: true,
    data: {
      bookingId: created.booking.id,
      referenceCode: created.booking.reference_code,
      totalCents: created.booking.total_cents,
      rentalDays: created.booking.rental_days,
      carName: car.name,
    },
  };
}

export async function attachCheckoutSession(
  store: BookingStore,
  bookingId: string,
  checkoutSessionId: string
): Promise<LifecycleResult> {
  await store.update(bookingId, {
    paymongo_checkout_session_id: checkoutSessionId,
  });
  return { ok: true, data: undefined as void };
}

export async function cancelBooking(
  store: BookingStore,
  input: {
    bookingId: string;
    customerId: string;
    reason?: string | null;
  },
  now: Date = new Date()
): Promise<LifecycleResult> {
  const booking = await store.getById(input.bookingId);
  if (!booking || booking.customer_id !== input.customerId) {
    return { ok: false, error: "Booking not found.", code: "not_found" };
  }

  if (!canCustomerCancel(booking, now)) {
    return {
      ok: false,
      error:
        "This booking cannot be cancelled. Paid bookings need 24h before pickup.",
      code: "not_eligible",
    };
  }

  await store.update(booking.id, {
    status: "cancelled",
    cancelled_at: now.toISOString(),
    cancel_reason: input.reason ?? null,
  });
  return { ok: true, data: undefined };
}

export type MarkPaidInput = {
  checkoutSessionId?: string | null;
  bookingId?: string | null;
  paymentId?: string | null;
  paymentIntentId?: string | null;
  amountPaidCents?: number | null;
};

export type MarkPaidData = {
  bookingId: string;
  alreadyPaid: boolean;
};

/**
 * Mark paid → confirmed. Refuses cancelled/expired (no resurrect).
 */
export async function markPaid(
  store: BookingStore,
  input: MarkPaidInput,
  now: Date = new Date()
): Promise<LifecycleResult<MarkPaidData>> {
  let booking: BookingRecord | null = null;

  if (input.checkoutSessionId) {
    booking = await store.getByCheckoutSessionId(input.checkoutSessionId);
  } else if (input.bookingId) {
    booking = await store.getById(input.bookingId);
  } else {
    return {
      ok: false,
      error: "checkoutSessionId or bookingId required",
      code: "invalid",
    };
  }

  if (!booking) {
    return { ok: false, error: "Booking not found.", code: "not_found" };
  }

  if (booking.payment_status === "paid") {
    return {
      ok: true,
      data: { bookingId: booking.id, alreadyPaid: true },
    };
  }

  if (
    booking.status === "cancelled" ||
    booking.payment_status === "expired"
  ) {
    console.error("markPaid refused: booking cancelled or expired", {
      bookingId: booking.id,
      status: booking.status,
      payment_status: booking.payment_status,
    });
    return {
      ok: false,
      error: "Booking is cancelled or expired; payment will not confirm it.",
      code: "conflict",
    };
  }

  await store.privilegedUpdate(booking.id, {
    payment_status: "paid",
    status: "confirmed",
    paid_at: now.toISOString(),
    amount_paid_cents: input.amountPaidCents ?? undefined,
    paymongo_payment_id: input.paymentId ?? undefined,
    paymongo_payment_intent_id: input.paymentIntentId ?? undefined,
  });

  return {
    ok: true,
    data: { bookingId: booking.id, alreadyPaid: false },
  };
}

export async function adminTransition(
  store: BookingStore,
  input: {
    bookingId: string;
    status: BookingStatus;
    adminNote?: string | null;
  }
): Promise<LifecycleResult> {
  const booking = await store.getById(input.bookingId);
  if (!booking) {
    return { ok: false, error: "Booking not found.", code: "not_found" };
  }

  if (!canAdminTransition(booking.status, input.status)) {
    return {
      ok: false,
      error: `Cannot change status from ${booking.status} to ${input.status}.`,
      code: "invalid_transition",
    };
  }

  const patch: {
    status?: BookingStatus;
    admin_note?: string | null;
    cancelled_at?: string | null;
  } = {
    status: input.status,
    admin_note: input.adminNote ?? null,
  };

  if (input.status === "cancelled" && booking.status !== "cancelled") {
    patch.cancelled_at = new Date().toISOString();
  }

  await store.update(booking.id, patch);
  return { ok: true, data: undefined };
}

/** Expire all stale unpaid holds for a car. */
export async function expireUnpaidForCar(
  store: BookingStore,
  carId: string,
  now: Date = new Date()
): Promise<LifecycleResult<{ expired: number }>> {
  const expired = await store.expireUnpaidForCar(
    carId,
    holdCutoff(now, CHECKOUT_HOLD_MINUTES)
  );
  return { ok: true, data: { expired } };
}

/** Re-export for callers that only need eligibility without a store. */
export type { BookingRecord, PaymentStatus, BookingStatus };
