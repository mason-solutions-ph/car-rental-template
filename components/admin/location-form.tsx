"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Location } from "@/types";

export function LocationForm({
  location,
  action,
}: {
  location?: Location | null;
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
    try {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/locations");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save location.");
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
          <Input id="name" name="name" defaultValue={location?.name} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input
            id="slug"
            name="slug"
            defaultValue={location?.slug}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input
            id="city"
            name="city"
            defaultValue={location?.city}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="region">Region</FieldLabel>
          <Input
            id="region"
            name="region"
            defaultValue={location?.region ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <Input
            id="country"
            name="country"
            defaultValue={location?.country ?? "PH"}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={location?.address_line1 ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            name="phone"
            defaultValue={location?.phone ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="sortOrder">Sort order</FieldLabel>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={location?.sort_order ?? 0}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="hoursNote">Hours note</FieldLabel>
          <Input
            id="hoursNote"
            name="hoursNote"
            defaultValue={location?.hours_note ?? ""}
          />
        </Field>
        <FormCheckbox
          className="sm:col-span-2"
          id="isPublished"
          name="isPublished"
          defaultChecked={location?.is_published ?? true}
          label="Published"
        />
      </FieldGroup>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Save location
      </Button>
    </form>
  );
}
