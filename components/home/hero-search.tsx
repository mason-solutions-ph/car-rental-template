import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Location } from "@/types";

const CLASS_OPTIONS = [
  { value: "", label: "Any class" },
  { value: "economy", label: "Economy" },
  { value: "compact", label: "Compact" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "luxury", label: "Luxury" },
  { value: "sports", label: "Sports" },
  { value: "van", label: "Van" },
];

export function HeroSearch({ locations }: { locations: Location[] }) {
  return (
    <Card className="w-full shadow-sm">
      <CardContent className="pt-0">
        <form action="/cars" method="get" className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="location">Pickup</FieldLabel>
              <FormSelect
                id="location"
                name="location"
                defaultValue=""
                placeholder="Any location"
                options={[
                  { value: "", label: "Any location" },
                  ...locations.map((loc) => ({
                    value: loc.slug,
                    label: loc.name,
                  })),
                ]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="from">From</FieldLabel>
              <Input id="from" name="from" type="date" />
            </Field>
            <Field>
              <FieldLabel htmlFor="to">To</FieldLabel>
              <Input id="to" name="to" type="date" />
            </Field>
            <Field>
              <FieldLabel htmlFor="class">Class</FieldLabel>
              <FormSelect
                id="class"
                name="class"
                defaultValue=""
                placeholder="Any class"
                options={CLASS_OPTIONS}
              />
            </Field>
          </FieldGroup>
          <Button type="submit" className="w-full sm:w-auto sm:self-end">
            Search cars
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
