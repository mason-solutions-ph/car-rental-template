import type { Car, CarFilters, CarWithImages, Location } from "@/types";

export type PublishedCarsPage = {
  cars: CarWithImages[];
  total: number;
  page: number;
  pageSize: number;
};

export type FleetMode = "demo" | "live";

/** Public + admin fleet reads. Two adapters: demo (in-memory seed) and Supabase. */
export type FleetRepo = {
  readonly mode: FleetMode;
  listPublishedCars(filters?: CarFilters): Promise<PublishedCarsPage>;
  getPublishedCarBySlug(slug: string): Promise<CarWithImages | null>;
  /** All cars including unpublished (admin). */
  listAllCars(): Promise<Car[]>;
  getCarById(id: string): Promise<Car | null>;
  listPublishedCarSlugs(): Promise<string[]>;
  listPublishedLocations(): Promise<Location[]>;
  /** All locations (admin). */
  listAllLocations(): Promise<Location[]>;
  getPublishedLocationBySlug(slug: string): Promise<Location | null>;
};
