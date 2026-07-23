import Link from "next/link";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAdminLocations } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin locations" };

export default async function AdminLocationsPage() {
  const locations = await listAdminLocations();

  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader
        eyebrow="Pickup hubs"
        title="Locations"
        actions={
          isSupabaseConfigured() ? (
            <Button asChild size="sm">
              <Link href="/admin/locations/new">Add location</Link>
            </Button>
          ) : undefined
        }
      />
      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No locations yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add pickup hubs so customers can choose where to collect a car.
          </p>
          {isSupabaseConfigured() ? (
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/locations/new">Add location</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {isSupabaseConfigured() ? (
                    <Link
                      href={`/admin/locations/${loc.id}/edit`}
                      className="underline-offset-4 hover:underline"
                    >
                      {loc.name}
                    </Link>
                  ) : (
                    loc.name
                  )}
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {loc.city}
                  {loc.region ? `, ${loc.region}` : ""} · {loc.slug}
                  {!loc.is_published ? " · unpublished" : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      {!isSupabaseConfigured() ? (
        <p className="text-muted-foreground text-xs">
          Demo locations are read-only. Connect Supabase to create and edit.
        </p>
      ) : null}
    </div>
  );
}
