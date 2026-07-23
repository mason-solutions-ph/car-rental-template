"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormSelect } from "@/components/forms/form-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { CAR_CLASSES } from "@/lib/constants";
import { pesosToCentavos, centavosToPesos } from "@/lib/format/currency";
import type { Car } from "@/types";

export function CarForm({
  car,
  action,
}: {
  car?: Car | null;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const pesos = Number(fd.get("dailyRatePesos"));
    fd.set("dailyRateCents", String(pesosToCentavos(pesos)));
    try {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/cars");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save car.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" defaultValue={car?.name} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input id="slug" name="slug" defaultValue={car?.slug} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="class">Class</FieldLabel>
          <FormSelect
            id="class"
            name="class"
            defaultValue={car?.class ?? "economy"}
            options={CAR_CLASSES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="make">Make</FieldLabel>
          <Input id="make" name="make" defaultValue={car?.make} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="model">Model</FieldLabel>
          <Input id="model" name="model" defaultValue={car?.model} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="year">Year</FieldLabel>
          <Input
            id="year"
            name="year"
            type="number"
            defaultValue={car?.year ?? 2024}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dailyRatePesos">Daily rate (₱)</FieldLabel>
          <Input
            id="dailyRatePesos"
            name="dailyRatePesos"
            type="number"
            step="0.01"
            defaultValue={car ? centavosToPesos(car.daily_rate_cents) : 2500}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="seats">Seats</FieldLabel>
          <Input
            id="seats"
            name="seats"
            type="number"
            defaultValue={car?.seats ?? 5}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <FormSelect
            id="status"
            name="status"
            defaultValue={car?.status ?? "available"}
            options={[
              { value: "available", label: "available" },
              { value: "maintenance", label: "maintenance" },
              { value: "retired", label: "retired" },
            ]}
          />
        </Field>
        <FormCheckbox
          className="sm:col-span-2"
          id="isPublished"
          name="isPublished"
          defaultChecked={car?.is_published ?? false}
          label="Published"
        />
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="heroImageUrl">Hero image URL</FieldLabel>
          <Input
            id="heroImageUrl"
            name="heroImageUrl"
            defaultValue={car?.hero_image_url ?? ""}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={car?.description ?? ""}
            rows={4}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Save car
      </Button>
    </form>
  );
}
