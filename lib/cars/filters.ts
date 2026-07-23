import type { CarClass, CarFilters, FuelType, Transmission } from "@/types";
import { CAR_CLASSES } from "@/lib/constants";

const SORTS = new Set(["price_asc", "price_desc", "name", "newest"]);

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.split(",").filter(Boolean);
}

export function parseCarSearchParams(
  sp: Record<string, string | string[] | undefined>
): CarFilters {
  const classes = asArray(sp.class).filter((c): c is CarClass =>
    (CAR_CLASSES as readonly string[]).includes(c)
  );

  const sortRaw = typeof sp.sort === "string" ? sp.sort : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : "1");
  const minPricePesos = Number(typeof sp.minPrice === "string" ? sp.minPrice : "");
  const maxPricePesos = Number(typeof sp.maxPrice === "string" ? sp.maxPrice : "");
  const seats = Number(typeof sp.seats === "string" ? sp.seats : "");

  return {
    q: typeof sp.q === "string" ? sp.q.trim() : undefined,
    class: classes.length ? classes : undefined,
    transmission:
      typeof sp.transmission === "string"
        ? (sp.transmission as Transmission)
        : undefined,
    fuel: typeof sp.fuel === "string" ? (sp.fuel as FuelType) : undefined,
    seats: Number.isFinite(seats) && seats > 0 ? seats : undefined,
    minPrice:
      Number.isFinite(minPricePesos) && minPricePesos > 0
        ? Math.round(minPricePesos * 100)
        : undefined,
    maxPrice:
      Number.isFinite(maxPricePesos) && maxPricePesos > 0
        ? Math.round(maxPricePesos * 100)
        : undefined,
    location: typeof sp.location === "string" ? sp.location : undefined,
    sort:
      sortRaw && SORTS.has(sortRaw)
        ? (sortRaw as CarFilters["sort"])
        : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 12,
  };
}

export function filtersToSearchParams(filters: CarFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  filters.class?.forEach((c) => p.append("class", c));
  if (filters.transmission) p.set("transmission", filters.transmission);
  if (filters.fuel) p.set("fuel", filters.fuel);
  if (filters.seats) p.set("seats", String(filters.seats));
  if (filters.minPrice != null) p.set("minPrice", String(filters.minPrice / 100));
  if (filters.maxPrice != null) p.set("maxPrice", String(filters.maxPrice / 100));
  if (filters.location) p.set("location", filters.location);
  if (filters.sort && filters.sort !== "newest") p.set("sort", filters.sort);
  if (filters.page && filters.page > 1) p.set("page", String(filters.page));
  return p;
}
