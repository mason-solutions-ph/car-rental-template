export const SITE_NAME = "Aether Drive";
export const SITE_DESCRIPTION =
  "Premium car rental — book and pay online with PayMongo.";

export const DEFAULT_CURRENCY = "PHP";
export const MIN_RENTAL_DAYS = 1;
export const MAX_RENTAL_DAYS = 30;
export const CANCEL_MIN_HOURS_BEFORE_PICKUP = 24;
/** Unpaid pending bookings hold inventory this long. */
export const CHECKOUT_HOLD_MINUTES = 30;

export const CAR_CLASSES = [
  "economy",
  "compact",
  "sedan",
  "suv",
  "luxury",
  "sports",
  "van",
] as const;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
  "expired",
] as const;
