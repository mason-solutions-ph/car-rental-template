import { DEMO_CARS, DEMO_LOCATIONS, demoImagesForCar } from "@/lib/data/demo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Car, CarFilters, CarWithImages } from "@/types";

function applyDemoFilters(cars: Car[], filters: CarFilters = {}): Car[] {
  let list = cars.filter((c) => c.is_published && c.status !== "retired");

  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
    );
  }
  if (filters.class?.length) {
    list = list.filter((c) => filters.class!.includes(c.class));
  }
  if (filters.transmission) {
    list = list.filter((c) => c.transmission === filters.transmission);
  }
  if (filters.fuel) {
    list = list.filter((c) => c.fuel_type === filters.fuel);
  }
  if (filters.seats) {
    list = list.filter((c) => c.seats >= filters.seats!);
  }
  if (filters.minPrice != null) {
    list = list.filter((c) => c.daily_rate_cents >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    list = list.filter((c) => c.daily_rate_cents <= filters.maxPrice!);
  }
  if (filters.location) {
    const loc = DEMO_LOCATIONS.find(
      (l) => l.slug === filters.location || l.id === filters.location
    );
    if (loc) {
      list = list.filter((c) => c.default_location_id === loc.id);
    }
  }

  switch (filters.sort) {
    case "price_asc":
      list = [...list].sort((a, b) => a.daily_rate_cents - b.daily_rate_cents);
      break;
    case "price_desc":
      list = [...list].sort((a, b) => b.daily_rate_cents - a.daily_rate_cents);
      break;
    case "name":
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list = [...list].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  return list;
}

function withImages(car: Car): CarWithImages {
  const loc =
    DEMO_LOCATIONS.find((l) => l.id === car.default_location_id) ?? null;
  return {
    ...car,
    car_images: demoImagesForCar(car),
    default_location: loc,
  };
}

export async function getPublishedCars(filters: CarFilters = {}): Promise<{
  cars: CarWithImages[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  if (!isSupabaseConfigured()) {
    const all = applyDemoFilters(DEMO_CARS, filters).map(withImages);
    const start = (page - 1) * pageSize;
    return {
      cars: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
    };
  }

  const supabase = await createClient();
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
  const { data, count, error } = await query.range(from, from + pageSize - 1);
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
}

export async function getFeaturedCars(limit = 6): Promise<CarWithImages[]> {
  const { cars } = await getPublishedCars({
    sort: "newest",
    page: 1,
    pageSize: limit,
  });
  return cars;
}

export async function getCarBySlug(
  slug: string
): Promise<CarWithImages | null> {
  if (!isSupabaseConfigured()) {
    const car = DEMO_CARS.find((c) => c.slug === slug && c.is_published);
    return car ? withImages(car) : null;
  }

  const supabase = await createClient();
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
}
