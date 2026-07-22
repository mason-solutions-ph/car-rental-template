import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CarGrid } from "@/components/cars/car-grid";
import { HeroSearch } from "@/components/home/hero-search";
import { FadeIn } from "@/components/motion/fade-in";
import { getFeaturedCars } from "@/lib/cars/queries";
import { getPublishedLocations } from "@/lib/locations/queries";
import { testimonials } from "@/lib/content/testimonials";
import { SITE_NAME } from "@/lib/constants";

export default async function HomePage() {
  const [cars, locations] = await Promise.all([
    getFeaturedCars(6),
    getPublishedLocations(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeIn>
          <div className="flex max-w-2xl flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              Philippines · PayMongo payments
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Drive out of {SITE_NAME} with confidence
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Browse a curated fleet, lock your dates, and pay securely online.
              Airport and city pickups in Metro Manila and Cebu.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.12} className="mt-8">
          <HeroSearch locations={locations} />
        </FadeIn>
      </section>

      <section className="bg-muted/40 border-y">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Featured fleet
              </h2>
              <p className="text-muted-foreground text-sm">
                Economy to luxury — priced in PHP per day.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/cars">View all</Link>
            </Button>
          </div>
          {cars.length ? (
            <CarGrid cars={cars} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No cars published yet. Connect Supabase and run the seed.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Choose dates",
              body: "Pick location and rental window from the search bar.",
            },
            {
              step: "2",
              title: "Select your car",
              body: "Filter by class, seats, and budget. Open details for specs.",
            },
            {
              step: "3",
              title: "Pay with PayMongo",
              body: "Card, GCash, Maya, and more. Instant confirmation after payment.",
            },
          ].map((item) => (
            <Card key={item.step}>
              <CardHeader>
                <Badge variant="outline" className="w-fit">
                  Step {item.step}
                </Badge>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Pickup locations
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <CardTitle className="text-base">{loc.name}</CardTitle>
                <CardDescription>
                  {loc.city}
                  {loc.hours_note ? ` · ${loc.hours_note}` : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            What renters say
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardHeader>
                  <CardDescription className="text-foreground text-sm leading-relaxed">
                    “{t.quote}”
                  </CardDescription>
                  <CardTitle className="text-sm font-medium">{t.name}</CardTitle>
                  <CardDescription>{t.role}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-primary-foreground text-2xl">
                Ready when you are
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Reserve your car and pay online in minutes.
              </CardDescription>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/cars">Browse fleet</Link>
            </Button>
          </CardHeader>
          <CardContent />
        </Card>
      </section>
    </div>
  );
}
