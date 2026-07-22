import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAdminLocations } from "@/lib/admin/queries";

export const metadata = { title: "Admin locations" };

export default async function AdminLocationsPage() {
  const locations = await listAdminLocations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardHeader>
              <CardTitle className="text-base">{loc.name}</CardTitle>
              <CardDescription>
                {loc.city}
                {loc.region ? `, ${loc.region}` : ""} · {loc.slug}
                {!loc.is_published ? " · unpublished" : ""}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Seed / SQL is the source of truth for locations in v1. Full CRUD can
        extend this page later.
      </p>
    </div>
  );
}
