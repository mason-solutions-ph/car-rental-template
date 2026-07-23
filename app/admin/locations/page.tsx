import { LocationsAdmin } from "@/components/admin/locations-admin";
import { listAdminLocations } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin locations" };

type Props = {
  searchParams: Promise<{ new?: string; edit?: string }>;
};

export default async function AdminLocationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locations = await listAdminLocations();
  const canWrite = isSupabaseConfigured();

  return (
    <LocationsAdmin
      locations={locations}
      canWrite={canWrite}
      openNew={sp.new === "1"}
      editId={sp.edit ?? null}
    />
  );
}
