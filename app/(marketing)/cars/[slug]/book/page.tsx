import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { quoteRental } from "@/lib/cars/pricing";
import { getCarBySlug } from "@/lib/cars/queries";
import { getPublishedLocations } from "@/lib/locations/queries";
import { isSupabaseConfigured } from "@/lib/env";
import type { Location } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Book & pay" };

export default async function BookCarPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [sp, car] = await Promise.all([searchParams, getCarBySlug(slug)]);
  if (!car) notFound();

  const nextPath = `/cars/${slug}/book?${new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]
    )
  )}`;

  let locations: Location[];
  if (isSupabaseConfigured()) {
    const [session, publishedLocations] = await Promise.all([
      getSessionProfile(),
      getPublishedLocations(),
    ]);
    if (!session) {
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
    locations = publishedLocations;
  } else {
    locations = await getPublishedLocations();
  }
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const pickupSlug =
    typeof sp.pickup === "string"
      ? sp.pickup
      : typeof sp.location === "string"
        ? sp.location
        : car.default_location?.slug;

  const pickupLoc =
    locations.find((l) => l.slug === pickupSlug) ?? locations[0];
  const dropoffSlug =
    typeof sp.dropoff === "string" ? sp.dropoff : pickupLoc?.slug;
  const dropoffLoc =
    locations.find((l) => l.slug === dropoffSlug) ?? pickupLoc;

  let estimate: { rentalDays: number; totalCents: number } | null = null;
  if (from && to) {
    const q = quoteRental(car.daily_rate_cents, new Date(from), new Date(to));
    if (q.ok) estimate = { rentalDays: q.rentalDays, totalCents: q.totalCents };
  }

  const dateOnly = (isoDate?: string) => {
    if (!isoDate) return undefined;
    return isoDate.slice(0, 10);
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Book & pay</CardTitle>
          <CardDescription>
            {!isSupabaseConfigured()
              ? "Demo mode: connect Supabase + PayMongo to complete live bookings."
              : "Confirm details, then continue to PayMongo checkout."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm
            carId={car.id}
            carName={car.name}
            dailyRateCents={car.daily_rate_cents}
            locations={locations}
            defaults={{
              pickupLocationId: pickupLoc?.id,
              dropoffLocationId: dropoffLoc?.id,
              pickupDate: dateOnly(from),
              dropoffDate: dateOnly(to),
              pickupTime: "10:00",
              dropoffTime: "10:00",
            }}
            estimate={estimate}
          />
          <p className="text-muted-foreground mt-4 text-center text-sm">
            <Link href={`/cars/${car.slug}`} className="underline-offset-4 hover:underline">
              Back to car details
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
