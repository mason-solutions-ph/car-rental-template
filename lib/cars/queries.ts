import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import type { CarFilters, CarWithImages } from "@/types";

export async function getPublishedCars(filters: CarFilters = {}) {
  const repo = await getFleetRepo();
  return repo.listPublishedCars(filters);
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
  const repo = await getFleetRepo();
  return repo.getPublishedCarBySlug(slug);
}
