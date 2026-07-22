"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function carPayload(formData: FormData) {
  return {
    name: String(formData.get("name")),
    slug: String(formData.get("slug")),
    make: String(formData.get("make")),
    model: String(formData.get("model")),
    year: Number(formData.get("year")),
    class: String(formData.get("class")),
    seats: Number(formData.get("seats") || 5),
    daily_rate_cents: Number(formData.get("dailyRateCents")),
    currency: "PHP",
    status: String(formData.get("status") || "available"),
    is_published: formData.get("isPublished") === "on",
    hero_image_url: String(formData.get("heroImageUrl") || "") || null,
    description: String(formData.get("description") || "") || null,
    transmission: "automatic" as const,
    fuel_type: "gasoline" as const,
  };
}

export async function createCar(formData: FormData) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("cars").insert(carPayload(formData));
  if (error) return { error: error.message };
  revalidatePath("/admin/cars");
  revalidatePath("/cars");
}

export async function updateCar(id: string, formData: FormData) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cars")
    .update(carPayload(formData))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/cars");
  revalidatePath("/cars");
}
