"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/profile";

export type ProfileState = { error?: string; success?: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const session = await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    licenseNumber: formData.get("licenseNumber"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      license_number: parsed.data.licenseNumber || null,
    })
    .eq("id", session.user.id);

  if (error) return { error: "Could not update profile." };
  revalidatePath("/account/profile");
  return { success: "Profile updated." };
}
