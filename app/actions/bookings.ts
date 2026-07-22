"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import {
  cancelBooking as lifecycleCancel,
  createBooking,
} from "@/lib/bookings/lifecycle";
import {
  canStartCheckout,
  startCheckout,
  toStartCheckoutBooking,
} from "@/lib/bookings/start-checkout";
import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import { isPaymongoConfigured, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingCreateSchema } from "@/lib/validations/booking";

export type BookingActionState = { error?: string };

async function userStore() {
  const user = await createClient();
  let admin: ReturnType<typeof createAdminClient> | undefined;
  try {
    admin = createAdminClient();
  } catch {
    admin = undefined;
  }
  return createSupabaseBookingStore({ user, admin });
}

export async function createBookingAndCheckout(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Connect your project to create real bookings.",
    };
  }

  const session = await requireUser();

  const pickupDate = String(formData.get("pickupDate") || "");
  const pickupTime = String(formData.get("pickupTime") || "10:00");
  const dropoffDate = String(formData.get("dropoffDate") || "");
  const dropoffTime = String(formData.get("dropoffTime") || "10:00");
  const pickupAt =
    String(formData.get("pickupAt") || "") ||
    (pickupDate ? `${pickupDate}T${pickupTime}` : "");
  const dropoffAt =
    String(formData.get("dropoffAt") || "") ||
    (dropoffDate ? `${dropoffDate}T${dropoffTime}` : "");

  const parsed = bookingCreateSchema.safeParse({
    carId: formData.get("carId"),
    pickupLocationId: formData.get("pickupLocationId"),
    dropoffLocationId: formData.get("dropoffLocationId"),
    pickupAt,
    dropoffAt,
    driverFullName: formData.get("driverFullName"),
    driverPhone: formData.get("driverPhone"),
    driverLicenseNumber: formData.get("driverLicenseNumber"),
    customerNote: formData.get("customerNote") || undefined,
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid booking details. Check dates and required fields.",
    };
  }

  const data = parsed.data;
  const store = await userStore();

  const created = await createBooking(store, {
    customerId: session.user.id,
    carId: data.carId,
    pickupLocationId: data.pickupLocationId,
    dropoffLocationId: data.dropoffLocationId,
    pickupAt: data.pickupAt,
    dropoffAt: data.dropoffAt,
    driverFullName: data.driverFullName,
    driverPhone: data.driverPhone,
    driverLicenseNumber: data.driverLicenseNumber,
    customerNote: data.customerNote,
  });

  if (!created.ok) {
    return { error: created.error };
  }

  const { bookingId, referenceCode, totalCents, rentalDays, carName } =
    created.data;

  if (!isPaymongoConfigured()) {
    redirect(`/account/bookings/${bookingId}?demo=1`);
  }

  const checkout = await startCheckout(store, {
    bookingId,
    referenceCode,
    totalCents,
    rentalDays,
    carName,
  });

  if (!checkout.ok) {
    return { error: checkout.error };
  }

  redirect(checkout.checkoutUrl);
}

export async function retryCheckout(
  bookingId: string
): Promise<BookingActionState> {
  if (!isSupabaseConfigured() || !isPaymongoConfigured()) {
    return { error: "Payments are not configured." };
  }

  const session = await requireUser();
  const store = await userStore();
  const booking = await store.getById(bookingId);

  if (!booking || booking.customer_id !== session.user.id) {
    return { error: "Booking not found." };
  }
  if (!canStartCheckout(booking)) {
    return { error: "This booking cannot be paid again." };
  }

  const checkout = await startCheckout(
    store,
    toStartCheckoutBooking(booking)
  );

  if (!checkout.ok) {
    return { error: checkout.error };
  }

  redirect(checkout.checkoutUrl);
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<BookingActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured." };

  const session = await requireUser();
  const store = await userStore();

  const result = await lifecycleCancel(store, {
    bookingId,
    customerId: session.user.id,
    reason,
  });

  if (!result.ok) return { error: result.error };
  redirect(`/account/bookings/${bookingId}`);
}
