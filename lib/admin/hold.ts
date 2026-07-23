import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";

export type HoldRemaining = {
  remainingMs: number;
  /** Share of the hold window still left, clamped to 0..1. */
  fraction: number;
  label: string;
};

/**
 * Remaining checkout-hold time for display. Mirrors the cutoff semantics of
 * lib/bookings/hold-policy holdCutoff: a hold is live while
 * created_at > now - holdMinutes.
 */
export function holdRemaining(
  createdAt: string,
  nowMs: number,
  holdMinutes = CHECKOUT_HOLD_MINUTES
): HoldRemaining {
  const holdMs = holdMinutes * 60 * 1000;
  const remainingMs = Math.max(
    0,
    new Date(createdAt).getTime() + holdMs - nowMs
  );
  const fraction = holdMs > 0 ? Math.min(1, remainingMs / holdMs) : 0;
  const label =
    remainingMs <= 0
      ? "Hold elapsed"
      : `${Math.ceil(remainingMs / 60_000)}m left`;
  return { remainingMs, fraction, label };
}
