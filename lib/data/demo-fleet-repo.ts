import {
  DEMO_CARS,
  DEMO_LOCATIONS,
  demoImagesForCar,
} from "@/lib/data/demo";
import type {
  FleetRepo,
  PublishedCarsPage,
} from "@/lib/data/fleet-repo";
import type { Car, CarFilters, CarWithImages, Location } from "@/types";

function applyFilters(cars: Car[], filters: CarFilters = {}): Car[] {
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

export function createDemoFleetRepo(): FleetRepo {
  return {
    mode: "demo",

    async listPublishedCars(filters: CarFilters = {}): Promise<PublishedCarsPage> {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 12;
      const all = applyFilters(DEMO_CARS, filters).map(withImages);
      const start = (page - 1) * pageSize;
      return {
        cars: all.slice(start, start + pageSize),
        total: all.length,
        page,
        pageSize,
      };
    },

    async getPublishedCarBySlug(slug) {
      const car = DEMO_CARS.find((c) => c.slug === slug && c.is_published);
      return car ? withImages(car) : null;
    },

    async listAllCars() {
      return [...DEMO_CARS].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },

    async getCarById(id) {
      return DEMO_CARS.find((c) => c.id === id) ?? null;
    },

    async listPublishedCarSlugs() {
      return DEMO_CARS.filter((c) => c.is_published).map((c) => c.slug);
    },

    async listPublishedLocations() {
      return [...DEMO_LOCATIONS]
        .filter((l) => l.is_published)
        .sort((a, b) => a.sort_order - b.sort_order);
    },

    async listAllLocations() {
      return [...DEMO_LOCATIONS].sort((a, b) => a.sort_order - b.sort_order);
    },

    async getPublishedLocationBySlug(slug) {
      return (
        DEMO_LOCATIONS.find((l) => l.slug === slug && l.is_published) ?? null
      );
    },
  };
}

/** Pure filter helper for tests (demo adapter implementation). */
export function filterDemoPublishedCars(
  filters: CarFilters,
  cars: Car[] = DEMO_CARS
): Car[] {
  return applyFilters(cars, filters);
}

export type { Location };
