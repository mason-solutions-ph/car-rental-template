import Link from "next/link";
import { CarGrid } from "@/components/cars/car-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  filtersToSearchParams,
  parseCarSearchParams,
} from "@/lib/cars/filters";
import { getPublishedCars } from "@/lib/cars/queries";
import { getPublishedLocations } from "@/lib/locations/queries";
import { CAR_CLASSES } from "@/lib/constants";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Fleet",
  description: "Browse available rental cars",
};

export default async function CarsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseCarSearchParams(sp);
  const [{ cars, total, page, pageSize }, locations] = await Promise.all([
    getPublishedCars(filters),
    getPublishedLocations(),
  ]);

  const hrefQuery = filtersToSearchParams({
    location: filters.location,
  }).toString();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Fleet</h1>
        <p className="text-muted-foreground text-sm">
          {total} car{total === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit lg:sticky lg:top-20">
          <form className="flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                name="q"
                placeholder="Make or model"
                defaultValue={filters.q ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                name="location"
                defaultValue={filters.location ?? ""}
                className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
              >
                <option value="">Any</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class">Class</Label>
              <select
                id="class"
                name="class"
                defaultValue={filters.class?.[0] ?? ""}
                className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
              >
                <option value="">Any</option>
                {CAR_CLASSES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sort">Sort</Label>
              <select
                id="sort"
                name="sort"
                defaultValue={filters.sort ?? "newest"}
                className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </div>
            <Button type="submit">Apply</Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/cars">Reset</Link>
            </Button>
          </form>
        </aside>

        <div className="flex flex-col gap-6">
          {filters.class?.length || filters.location || filters.q ? (
            <div className="flex flex-wrap gap-2">
              {filters.q ? <Badge variant="secondary">“{filters.q}”</Badge> : null}
              {filters.class?.map((c) => (
                <Badge key={c} variant="secondary" className="capitalize">
                  {c}
                </Badge>
              ))}
              {filters.location ? (
                <Badge variant="secondary">{filters.location}</Badge>
              ) : null}
            </div>
          ) : null}

          {cars.length ? (
            <CarGrid cars={cars} hrefQuery={hrefQuery || undefined} />
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <p className="font-medium">No cars match these filters</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try clearing filters or choosing another location.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/cars">Clear filters</Link>
              </Button>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/cars?${new URLSearchParams({
                      ...Object.fromEntries(
                        Object.entries(sp).flatMap(([k, v]) =>
                          v == null
                            ? []
                            : Array.isArray(v)
                              ? v.map((x) => [k, x])
                              : [[k, v]]
                        )
                      ),
                      page: String(page - 1),
                    }).toString()}`}
                  >
                    Previous
                  </Link>
                </Button>
              ) : null}
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/cars?${new URLSearchParams({
                      page: String(page + 1),
                    }).toString()}`}
                  >
                    Next
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
