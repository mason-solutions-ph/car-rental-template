import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublishedCars } from "@/lib/cars/queries";
import { getLocationBySlug } from "@/lib/locations/queries";
import { SITE_NAME } from "@/lib/constants";
import { CarCard } from "@/components/cars/car-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const loc = await getLocationBySlug(slug);
  if (!loc) return { title: "Location not found" };
  return {
    title: loc.name,
    description: `Pickup at ${loc.name}, ${loc.city} — ${SITE_NAME}`,
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  const loc = await getLocationBySlug(slug);
  if (!loc) notFound();

  const { cars } = await getPublishedCars({
    location: loc.slug,
    pageSize: 12,
  });

  const mapsQuery = encodeURIComponent(
    [loc.name, loc.address_line1, loc.city, loc.country]
      .filter(Boolean)
      .join(", ")
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          <Link href="/locations" className="hover:underline">
            Locations
          </Link>
          <span className="mx-1.5">/</span>
          {loc.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{loc.name}</h1>
        <p className="text-muted-foreground max-w-2xl">
          {loc.address_line1 ? `${loc.address_line1}, ` : ""}
          {loc.city}
          {loc.region ? `, ${loc.region}` : ""} · {loc.country}
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours</CardTitle>
            <CardDescription>
              {loc.hours_note ?? "Contact us for hours"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {loc.phone ? <p>Phone: {loc.phone}</p> : <p>Phone: see contact</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Directions</CardTitle>
            <CardDescription>Open in Google Maps</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
              >
                View map
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 text-xl font-semibold tracking-tight">
        Cars often based here
      </h2>
      {cars.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No published cars for this location right now.{" "}
          <Link href="/cars" className="underline underline-offset-4">
            Browse the full fleet
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
