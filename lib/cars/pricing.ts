import { MAX_RENTAL_DAYS, MIN_RENTAL_DAYS } from "@/lib/constants";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole 24h blocks, minimum 1 day. */
export function rentalDays(pickup: Date, dropoff: Date): number {
  const ms = dropoff.getTime() - pickup.getTime();
  if (ms <= 0) return 0;
  return Math.max(MIN_RENTAL_DAYS, Math.ceil(ms / MS_PER_DAY));
}

export function quoteRental(
  dailyRateCentavos: number,
  pickup: Date,
  dropoff: Date,
  feesCentavos = 0
) {
  const days = rentalDays(pickup, dropoff);
  if (days < MIN_RENTAL_DAYS || days > MAX_RENTAL_DAYS) {
    return {
      ok: false as const,
      error:
        days > MAX_RENTAL_DAYS
          ? `Maximum rental is ${MAX_RENTAL_DAYS} days.`
          : "Invalid rental dates.",
      rentalDays: days,
      subtotalCents: 0,
      feesCents: 0,
      totalCents: 0,
    };
  }

  const subtotalCents = dailyRateCentavos * days;
  const feesCents = feesCentavos;
  return {
    ok: true as const,
    rentalDays: days,
    subtotalCents,
    feesCents,
    totalCents: subtotalCents + feesCents,
  };
}
