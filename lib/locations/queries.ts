import { DEMO_LOCATIONS } from "@/lib/data/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Location } from "@/types";

export async function getPublishedLocations(): Promise<Location[]> {
  if (!isSupabaseConfigured()) {
    return [...DEMO_LOCATIONS].sort((a, b) => a.sort_order - b.sort_order);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as Location[];
}

export async function getLocationBySlug(
  slug: string
): Promise<Location | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_LOCATIONS.find((l) => l.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data as Location | null;
}
