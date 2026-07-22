import {
  attachCheckoutSession,
  type BookingRecord,
} from "@/lib/bookings/lifecycle";
import type { BookingStore } from "@/lib/bookings/store";
import { getAppUrl } from "@/lib/env";
import {
  createCheckoutSession,
  type CreateCheckoutInput,
} from "@/lib/paymongo/checkout";

export type StartCheckoutBooking = {
  bookingId: string;
  referenceCode: string;
  totalCents: number;
  rentalDays: number;
  carName: string;
};

export type StartCheckoutResult =
  | { ok: true; checkoutUrl: string; checkoutSessionId: string }
  | { ok: false; error: string };

export type CheckoutSessionFactory = (
  input: CreateCheckoutInput
) => Promise<{ id: string; checkoutUrl: string }>;

/**
 * Create a PayMongo Checkout Session, attach its id to the Booking, return redirect URL.
 * Shared by create-and-pay and retry-pay paths.
 */
export async function startCheckout(
  store: BookingStore,
  booking: StartCheckoutBooking,
  deps: {
    createSession?: CheckoutSessionFactory;
    appUrl?: string;
  } = {}
): Promise<StartCheckoutResult> {
  const createSession = deps.createSession ?? createCheckoutSession;
  const appUrl = deps.appUrl ?? getAppUrl();

  try {
    const checkout = await createSession({
      bookingId: booking.bookingId,
      referenceCode: booking.referenceCode,
      amountCentavos: booking.totalCents,
      carName: booking.carName,
      rentalDays: booking.rentalDays,
      successUrl: `${appUrl}/bookings/payment/success?booking_id=${booking.bookingId}`,
      cancelUrl: `${appUrl}/bookings/payment/cancel?booking_id=${booking.bookingId}`,
    });

    await attachCheckoutSession(store, booking.bookingId, checkout.id);

    return {
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      checkoutSessionId: checkout.id,
    };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Payment session failed. You can retry from your booking page.",
    };
  }
}

/** Unpaid pending only — retry / first pay. */
export function canStartCheckout(
  booking: Pick<BookingRecord, "status" | "payment_status">
): boolean {
  return booking.payment_status === "unpaid" && booking.status === "pending";
}

export function toStartCheckoutBooking(
  booking: BookingRecord,
  carNameFallback = "Car rental"
): StartCheckoutBooking {
  return {
    bookingId: booking.id,
    referenceCode: booking.reference_code,
    totalCents: booking.total_cents,
    rentalDays: booking.rental_days,
    carName: booking.car_name ?? carNameFallback,
  };
}
