import {
  markPaid as lifecycleMarkPaid,
  type MarkPaidInput,
} from "@/lib/bookings/lifecycle";
import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Privileged mark-paid entry for webhooks and success reconcile.
 * Prefer importing lifecycle.markPaid with an explicit store in new code.
 */
export async function markBookingPaid(opts: MarkPaidInput) {
  const store = createSupabaseBookingStore({
    admin: createAdminClient(),
  });
  const result = await lifecycleMarkPaid(store, opts);
  if (!result.ok) {
    if (result.code === "not_found") {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (result.code === "conflict") {
      return { ok: false as const, reason: "conflict" as const };
    }
    throw new Error(result.error);
  }
  return {
    ok: true as const,
    alreadyPaid: result.data.alreadyPaid,
    bookingId: result.data.bookingId,
  };
}
