"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminBookingById } from "@/lib/admin/queries";
import {
  adminTransition,
  expireAllStaleUnpaid,
} from "@/lib/bookings/lifecycle";
import { createPrivilegedBookingStore } from "@/lib/bookings/privileged-store";
import { reconcileCheckoutPayment } from "@/lib/bookings/reconcile-payment";
import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types";

export async function updateAdminBookingStatus(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  await requireAdmin();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as BookingStatus;
  const adminNote = String(formData.get("adminNote") || "");

  if (!id || !status) {
    throw new Error("Missing booking id or status.");
  }

  const user = await createClient();
  const store = createSupabaseBookingStore({ user });
  const result = await adminTransition(store, {
    bookingId: id,
    status,
    adminNote,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export type ReconcileAdminResult = {
  ok: boolean;
  message: string;
  reconciled?: boolean;
};

/**
 * Admin one-click: pull PayMongo Checkout Session and mark paid if settled.
 */
export async function reconcileAdminBooking(
  bookingId: string
): Promise<ReconcileAdminResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }

  await requireAdmin();

  if (!bookingId) {
    return { ok: false, message: "Missing booking id." };
  }

  const booking = await getAdminBookingById(bookingId);
  if (!booking) {
    return { ok: false, message: "Booking not found." };
  }

  if (booking.payment_status === "paid") {
    return { ok: true, message: "Already paid.", reconciled: false };
  }

  if (booking.payment_status === "expired") {
    return {
      ok: false,
      message: "Checkout hold expired; payment will not confirm this booking.",
    };
  }

  if (booking.status === "cancelled") {
    return {
      ok: false,
      message: "Booking is cancelled; payment will not confirm it.",
    };
  }

  if (!booking.paymongo_checkout_session_id) {
    return {
      ok: false,
      message: "No PayMongo checkout session on this booking.",
    };
  }

  const result = await reconcileCheckoutPayment({
    bookingId: booking.id,
    paymentStatus: booking.payment_status,
    checkoutSessionId: booking.paymongo_checkout_session_id,
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");

  if (result.reconciled) {
    return {
      ok: true,
      reconciled: true,
      message: "Payment found — booking marked paid and confirmed.",
    };
  }

  const messages: Record<string, string> = {
    already_paid: "Already paid.",
    no_session: "No PayMongo checkout session on this booking.",
    not_configured:
      "Reconcile needs PAYMONGO_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY.",
    not_paid_yet: "PayMongo session has no successful payment yet.",
    not_found: "Booking not found while applying payment.",
    conflict: "Booking is cancelled or expired; cannot mark paid.",
    error: "Could not reach PayMongo. Try again shortly.",
  };

  const reason = result.reason ?? "error";
  return {
    ok: reason === "already_paid" || reason === "not_paid_yet",
    reconciled: false,
    message: messages[reason] ?? `Reconcile did not apply (${reason}).`,
  };
}

/**
 * Admin manual run of the same job as the expire-unpaid cron.
 */
export async function expireStaleUnpaidAction(): Promise<{
  ok: boolean;
  message: string;
  expired?: number;
}> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  if (!isServiceRoleConfigured()) {
    return { ok: false, message: "SUPABASE_SERVICE_ROLE_KEY is required." };
  }

  try {
    const store = createPrivilegedBookingStore();
    const result = await expireAllStaleUnpaid(store);
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");

    if (!result.ok) {
      return { ok: false, message: result.error };
    }

    const expired = result.data.expired;
    return {
      ok: true,
      expired,
      message:
        expired === 0
          ? "No stale unpaid holds to expire."
          : `Expired ${expired} unpaid hold${expired === 1 ? "" : "s"}.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Expire unpaid failed.",
    };
  }
}
