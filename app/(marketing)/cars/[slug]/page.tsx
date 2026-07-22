import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCarBySlug } from "@/lib/cars/queries";
import { quoteRental } from "@/lib/cars/pricing";
import { formatMoney } from "@/lib/format/currency";
import { SITE_NAME } from "@/lib/constants";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { title: "Car not found" };
  return {
    title: car.name,
    description: car.description ?? `Rent ${car.name} with ${SITE_NAME}`,
  };
}

export default async function CarDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [sp, car] = await Promise.all([searchParams, getCarBySlug(slug)]);
  if (!car) notFound();

  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const location =
    typeof sp.location === "string"
      ? sp.location
      : car.default_location?.slug;

  let estimate: string | null = null;
  if (from && to) {
    const quote = quoteRental(
      car.daily_rate_cents,
      new Date(from),
      new Date(to)
    );
    if (quote.ok) {
      estimate = `${formatMoney(quote.totalCents)} for ${quote.rentalDays} day${quote.rentalDays === 1 ? "" : "s"}`;
    }
  }

  const bookParams = new URLSearchParams();
  if (from) bookParams.set("from", from);
  if (to) bookParams.set("to", to);
  if (location) bookParams.set("pickup", location);
  if (location) bookParams.set("dropoff", location);
  const bookHref = `/cars/${car.slug}/book${bookParams.size ? `?${bookParams}` : ""}`;

  const img =
    car.hero_image_url || car.car_images?.[0]?.url || "/window.svg";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image
              src={img}
              alt={car.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 60vw"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {car.class}
              </Badge>
              <Badge variant="outline">{car.year}</Badge>
              <Badge variant="outline" className="capitalize">
                {car.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{car.name}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {car.description}
            </p>
          </div>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Specifications</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ["Seats", String(car.seats)],
                ["Doors", String(car.doors)],
                ["Transmission", car.transmission],
                ["Fuel", car.fuel_type],
                ["Luggage", car.luggage_capacity ? String(car.luggage_capacity) : "—"],
                ["Make", car.make],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3">
                  <dt className="text-muted-foreground text-xs">{k}</dt>
                  <dd className="mt-1 font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {car.features?.length ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Features</h2>
              <ul className="flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <li key={f}>
                    <Badge variant="outline">{f}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {formatMoney(car.daily_rate_cents)}
                <span className="text-muted-foreground text-base font-normal">
                  {" "}
                  / day
                </span>
              </CardTitle>
              <CardDescription>
                {estimate ?? "Add dates to see a total estimate."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {car.default_location ? (
                <p className="text-muted-foreground text-sm">
                  Default pickup: {car.default_location.name},{" "}
                  {car.default_location.city}
                </p>
              ) : null}
              {car.status === "available" ? (
                <Button asChild size="lg">
                  <Link href={bookHref}>Book & pay</Link>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  Unavailable
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/cars">Back to fleet</Link>
              </Button>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Full payment via PayMongo at checkout. Taxes may apply at the
                counter.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
