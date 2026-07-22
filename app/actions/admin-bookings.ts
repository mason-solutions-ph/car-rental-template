"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminTransition } from "@/lib/bookings/lifecycle";
import { createSupabaseBookingStore } from "@/lib/bookings/supabase-store";
import { isSupabaseConfigured } from "@/lib/env";
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
