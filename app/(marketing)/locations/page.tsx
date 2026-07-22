import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublishedLocations } from "@/lib/locations/queries";

export const metadata = { title: "Locations" };

export default async function LocationsPage() {
  const locations = await getPublishedLocations();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Locations</h1>
        <p className="text-muted-foreground text-sm">
          Airport and city hubs for pickup and drop-off.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <Link key={loc.id} href={`/cars?location=${loc.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{loc.name}</CardTitle>
                <CardDescription>
                  {loc.city}
                  {loc.hours_note ? ` · ${loc.hours_note}` : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
