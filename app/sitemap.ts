import type { MetadataRoute } from "next";
import { DEMO_CARS } from "@/lib/data/demo";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const staticRoutes = ["", "/cars", "/locations", "/about", "/contact", "/faq", "/terms", "/privacy"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    })
  );

  let slugs = DEMO_CARS.map((c) => c.slug);
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("cars")
        .select("slug")
        .eq("is_published", true);
      if (data?.length) slugs = data.map((c) => c.slug);
    } catch {
      // keep demo
    }
  }

  return [
    ...staticRoutes,
    ...slugs.map((slug) => ({
      url: `${base}/cars/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
