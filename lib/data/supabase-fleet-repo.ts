import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FleetRepo,
  PublishedCarsPage,
} from "@/lib/data/fleet-repo";
import type { Car, CarFilters, CarWithImages, Location } from "@/types";

export function createSupabaseFleetRepo(supabase: SupabaseClient): FleetRepo {
  return {
    mode: "live",

    async listPublishedCars(filters: CarFilters = {}): Promise<PublishedCarsPage> {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 12;

      let query = supabase
        .from("cars")
        .select("*, car_images(*), default_location:locations(*)", {
          count: "exact",
        })
        .eq("is_published", true)
        .neq("status", "retired");

      if (filters.q) {
        query = query.or(
          `name.ilike.%${filters.q}%,make.ilike.%${filters.q}%,model.ilike.%${filters.q}%`
        );
      }
      if (filters.class?.length) query = query.in("class", filters.class);
      if (filters.transmission)
        query = query.eq("transmission", filters.transmission);
      if (filters.fuel) query = query.eq("fuel_type", filters.fuel);
      if (filters.seats) query = query.gte("seats", filters.seats);
      if (filters.minPrice != null)
        query = query.gte("daily_rate_cents", filters.minPrice);
      if (filters.maxPrice != null)
        query = query.lte("daily_rate_cents", filters.maxPrice);
      if (filters.location) {
        const { data: loc } = await supabase
          .from("locations")
          .select("id")
          .or(`slug.eq.${filters.location},id.eq.${filters.location}`)
          .maybeSingle();
        if (loc) query = query.eq("default_location_id", loc.id);
      }

      switch (filters.sort) {
        case "price_asc":
          query = query.order("daily_rate_cents", { ascending: true });
          break;
        case "price_desc":
          query = query.order("daily_rate_cents", { ascending: false });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const { data, count, error } = await query.range(
        from,
        from + pageSize - 1
      );
      if (error) {
        console.error(error);
        return { cars: [], total: 0, page, pageSize };
      }

      return {
        cars: (data ?? []) as CarWithImages[],
        total: count ?? 0,
        page,
        pageSize,
      };
    },

    async getPublishedCarBySlug(slug) {
      const { data, error } = await supabase
        .from("cars")
        .select("*, car_images(*), default_location:locations(*)")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) {
        console.error(error);
        return null;
      }
      return data as CarWithImages | null;
    },

    async listAllCars() {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        return [];
      }
      return (data ?? []) as Car[];
    },

    async getCarById(id) {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error(error);
        return null;
      }
      return data as Car | null;
    },

    async listPublishedCarSlugs() {
      const { data, error } = await supabase
        .from("cars")
        .select("slug")
        .eq("is_published", true);
      if (error) {
        console.error(error);
        return [];
      }
      return (data ?? []).map((r) => r.slug as string);
    },

    async listPublishedLocations() {
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
    },

    async listAllLocations() {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error(error);
        return [];
      }
      return (data ?? []) as Location[];
    },

    async getPublishedLocationBySlug(slug) {
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
    },
  };
}
