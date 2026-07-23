import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import type { BookingStore } from "@/lib/bookings/store";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service-role BookingStore for mark paid, expire unpaid, webhook, reconcile.
 * Throws if admin client env is missing (callers at HTTP/admin edge map errors).
 */
export function createPrivilegedBookingStore(): BookingStore {
  return createSupabaseBookingStore({
    admin: createAdminClient(),
  });
}
