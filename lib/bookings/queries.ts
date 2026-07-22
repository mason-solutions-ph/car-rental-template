import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BookingWithRelations } from "@/types";

export async function getMyBookings(
  userId: string
): Promise<BookingWithRelations[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*,
      car:cars(id, name, slug, hero_image_url, daily_rate_cents),
      pickup_location:locations!bookings_pickup_location_id_fkey(id, name, city, slug),
      dropoff_location:locations!bookings_dropoff_location_id_fkey(id, name, city, slug)`
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as BookingWithRelations[];
}

export async function getMyBooking(
  userId: string,
  bookingId: string
): Promise<BookingWithRelations | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*,
      car:cars(id, name, slug, hero_image_url, daily_rate_cents),
      pickup_location:locations!bookings_pickup_location_id_fkey(id, name, city, slug),
      dropoff_location:locations!bookings_dropoff_location_id_fkey(id, name, city, slug)`
    )
    .eq("customer_id", userId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as BookingWithRelations | null;
}
