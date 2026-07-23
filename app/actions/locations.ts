"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function locationPayload(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugRaw = String(formData.get("slug") || "").trim();
  return {
    name,
    slug: slugRaw || slugify(name),
    city: String(formData.get("city") || "").trim(),
    region: String(formData.get("region") || "") || null,
    country: String(formData.get("country") || "PH").trim() || "PH",
    address_line1: String(formData.get("addressLine1") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    hours_note: String(formData.get("hoursNote") || "") || null,
    is_published: formData.get("isPublished") === "on",
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
  };
}

export async function createLocation(
  formData: FormData
): Promise<{ error?: string } | void> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  await requireAdmin();
  const payload = locationPayload(formData);
  if (!payload.name || !payload.city || !payload.slug) {
    return { error: "Name, city, and slug are required." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  revalidatePath("/");
}

export async function updateLocation(
  id: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  await requireAdmin();
  const payload = locationPayload(formData);
  if (!payload.name || !payload.city || !payload.slug) {
    return { error: "Name, city, and slug are required." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  revalidatePath("/");
}
