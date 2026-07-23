"use server";

import { revalidatePath } from "next/cache";
import {
  CAR_IMAGE_BUCKET,
  carImageObjectPath,
  validateCarImageFile,
} from "@/lib/admin/upload-image";
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

/** Upload a hero image to Storage and return its public URL. */
export async function uploadCarHeroImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Connect Supabase Storage to upload files, or paste an image URL instead.",
    };
  }
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose an image file." };
  }

  const validation = validateCarImageFile(file);
  if (!validation.ok) return { error: validation.error };

  const path = carImageObjectPath(validation.ext);
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CAR_IMAGE_BUCKET)
    .upload(path, buffer, {
      contentType: validation.contentType,
      upsert: false,
    });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      return {
        error:
          "Storage bucket missing. Run the car-images storage migration, or paste a URL.",
      };
    }
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(CAR_IMAGE_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { error: "Upload succeeded but public URL was not returned." };
  }
  return { url: data.publicUrl };
}
