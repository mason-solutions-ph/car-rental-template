import Link from "next/link";
import { CarGrid } from "@/components/cars/car-grid";
import { FormSelect } from "@/components/forms/form-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

function searchParamsToRecord(
  sp: Record<string, string | string[] | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    out[k] = Array.isArray(v) ? (v[0] ?? "") : v;
  }
  return out;
}

function pageHref(
  sp: Record<string, string | string[] | undefined>,
  page: number
) {
  const base = searchParamsToRecord(sp);
  base.page = String(page);
  if (page <= 1) delete base.page;
  return `/cars?${new URLSearchParams(base).toString()}`;
}

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
          <Card>
            <CardContent className="pt-0">
              <form className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="q">Search</FieldLabel>
                    <Input
                      id="q"
                      name="q"
                      placeholder="Make or model"
                      defaultValue={filters.q ?? ""}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="location">Location</FieldLabel>
                    <FormSelect
                      id="location"
                      name="location"
                      defaultValue={filters.location ?? ""}
                      options={[
                        { value: "", label: "Any" },
                        ...locations.map((l) => ({
                          value: l.slug,
                          label: l.name,
                        })),
                      ]}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="class">Class</FieldLabel>
                    <FormSelect
                      id="class"
                      name="class"
                      defaultValue={filters.class?.[0] ?? ""}
                      options={[
                        { value: "", label: "Any" },
                        ...CAR_CLASSES.map((c) => ({
                          value: c,
                          label: c,
                        })),
                      ]}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sort">Sort</FieldLabel>
                    <FormSelect
                      id="sort"
                      name="sort"
                      defaultValue={filters.sort ?? "newest"}
                      options={[
                        { value: "newest", label: "Newest" },
                        { value: "price_asc", label: "Price: low to high" },
                        { value: "price_desc", label: "Price: high to low" },
                        { value: "name", label: "Name" },
                      ]}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit">Apply</Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cars">Reset</Link>
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>

        <div className="flex flex-col gap-6">
          {filters.class?.length || filters.location || filters.q ? (
            <div className="flex flex-wrap gap-2">
              {filters.q ? (
                <Badge variant="secondary">“{filters.q}”</Badge>
              ) : null}
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
            <Empty className="border border-dashed p-10">
              <EmptyHeader>
                <EmptyTitle>No cars match these filters</EmptyTitle>
                <EmptyDescription>
                  Try clearing filters or choosing another location.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link href="/cars">Clear filters</Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                {page > 1 ? (
                  <PaginationItem>
                    <PaginationPrevious href={pageHref(sp, page - 1)} />
                  </PaginationItem>
                ) : null}
                <PaginationItem>
                  <span className="text-muted-foreground px-2 text-sm">
                    Page {page} of {totalPages}
                  </span>
                </PaginationItem>
                {page < totalPages ? (
                  <PaginationItem>
                    <PaginationNext href={pageHref(sp, page + 1)} />
                  </PaginationItem>
                ) : null}
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      </div>
    </div>
  );
}
