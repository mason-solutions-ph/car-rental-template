import { createDemoFleetRepo } from "@/lib/data/demo-fleet-repo";
import type { FleetRepo } from "@/lib/data/fleet-repo";
import { createSupabaseFleetRepo } from "@/lib/data/supabase-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Single seam for demo vs live fleet data.
 * Callers must not branch on isSupabaseConfigured for cars/locations reads.
 */
export async function getFleetRepo(): Promise<FleetRepo> {
  if (!isSupabaseConfigured()) {
    return createDemoFleetRepo();
  }
  const supabase = await createClient();
  return createSupabaseFleetRepo(supabase);
}
