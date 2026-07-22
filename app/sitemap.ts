import type { MetadataRoute } from "next";
import { getFleetRepo } from "@/lib/data/get-fleet-repo";
import { getAppUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const staticRoutes = [
    "",
    "/cars",
    "/locations",
    "/about",
    "/contact",
    "/faq",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  let slugs: string[] = [];
  try {
    const fleet = await getFleetRepo();
    slugs = await fleet.listPublishedCarSlugs();
  } catch {
    slugs = [];
  }

  return [
    ...staticRoutes,
    ...slugs.map((slug) => ({
      url: `${base}/cars/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
