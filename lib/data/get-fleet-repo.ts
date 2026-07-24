import { createDemoFleetRepo } from "@/lib/data/demo-fleet-repo";
import type { FleetMode, FleetRepo } from "@/lib/data/fleet-repo";
import { createSupabaseFleetRepo } from "@/lib/data/supabase-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Synchronous source of truth for demo vs live. getFleetRepo branches on this,
 * so callers can decide layout without awaiting a query first.
 * Callers must not branch on isSupabaseConfigured directly.
 */
export function getFleetMode(): FleetMode {
  return isSupabaseConfigured() ? "live" : "demo";
}

/**
 * Single seam for demo vs live fleet data.
 * Callers must not branch on isSupabaseConfigured for cars/locations reads.
 */
export async function getFleetRepo(): Promise<FleetRepo> {
  if (getFleetMode() === "demo") {
    return createDemoFleetRepo();
  }
  const supabase = await createClient();
  return createSupabaseFleetRepo(supabase);
}
