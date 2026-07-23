import type { BookingStatus, PaymentStatus } from "@/types";

/** Snapshot of a car as needed for create. */
export type BookableCar = {
  id: string;
  name: string;
  daily_rate_cents: number;
  currency: string;
  is_published: boolean;
  status: string;
};

/** Booking row fields the lifecycle needs. */
export type BookingRecord = {
  id: string;
  reference_code: string;
  customer_id: string;
  car_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  pickup_at: string;
  dropoff_at: string;
  total_cents: number;
  rental_days: number;
  paymongo_checkout_session_id: string | null;
  created_at: string;
  car_name?: string | null;
};

export type InsertPendingBookingInput = {
  customerId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupAt: string;
  dropoffAt: string;
  dailyRateCents: number;
  rentalDays: number;
  subtotalCents: number;
  feesCents: number;
  totalCents: number;
  driverFullName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  customerNote?: string | null;
};

export type BookingUpdatePatch = {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  paid_at?: string | null;
  amount_paid_cents?: number | null;
  paymongo_checkout_session_id?: string | null;
  paymongo_payment_id?: string | null;
  paymongo_payment_intent_id?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  admin_note?: string | null;
};

/**
 * Persistence seam for the Booking lifecycle module.
 * Two adapters: Supabase (prod) and in-memory (tests).
 */
export type BookingStore = {
  getBookableCar(carId: string): Promise<BookableCar | null>;
  isCarAvailable(input: {
    carId: string;
    pickupAt: string;
    dropoffAt: string;
    holdMinutes: number;
    excludeBookingId?: string | null;
  }): Promise<boolean>;
  /** Mark stale pending+unpaid holds for this car as expired. Returns count. */
  expireUnpaidForCar(carId: string, olderThan: Date): Promise<number>;
  /** Mark all stale pending+unpaid holds (any car) as expired. Returns count. */
  expireAllStaleUnpaid(olderThan: Date): Promise<number>;
  insertPending(
    input: InsertPendingBookingInput
  ): Promise<
    | { ok: true; booking: Pick<BookingRecord, "id" | "reference_code" | "total_cents" | "rental_days"> }
    | { ok: false; error: string }
  >;
  getById(id: string): Promise<BookingRecord | null>;
  getByCheckoutSessionId(sessionId: string): Promise<BookingRecord | null>;
  /** Customer / admin session writes (RLS). */
  update(id: string, patch: BookingUpdatePatch): Promise<void>;
  /** Service-role writes (webhooks, expire holds). Falls back to update if no admin client. */
  privilegedUpdate(id: string, patch: BookingUpdatePatch): Promise<void>;
};
