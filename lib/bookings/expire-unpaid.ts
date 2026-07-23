import { expireAllStaleUnpaid } from "@/lib/bookings/lifecycle";
import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Privileged global expire for cron and admin. Requires service role.
 */
export async function runExpireStaleUnpaidHolds(
  now: Date = new Date()
): Promise<{ ok: true; expired: number } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  if (!isServiceRoleConfigured()) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required." };
  }

  const store = createSupabaseBookingStore({
    admin: createAdminClient(),
  });
  const result = await expireAllStaleUnpaid(store, now);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, expired: result.data.expired };
}
