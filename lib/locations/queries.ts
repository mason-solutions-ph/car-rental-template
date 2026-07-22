import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import type { Location } from "@/types";

export async function getPublishedLocations(): Promise<Location[]> {
  const repo = await getFleetRepo();
  return repo.listPublishedLocations();
}

export async function getLocationBySlug(
  slug: string
): Promise<Location | null> {
  const repo = await getFleetRepo();
  return repo.getPublishedLocationBySlug(slug);
}
