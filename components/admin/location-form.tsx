"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { slugify } from "@/lib/format/slug";
import type { Location } from "@/types";

export function LocationForm({
  location,
  action,
  onSuccess,
}: {
  location?: Location | null;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const formId = useId();
  const isEdit = Boolean(location?.id);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(location?.name ?? "");
  const [slug, setSlug] = useState(location?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(isEdit);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("name", name);
    fd.set("slug", slug);
    try {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Location updated" : "Location created");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save location.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
          <Input
            id={`${formId}-name`}
            name="name"
            value={name}
            required
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value;
              setName(next);
              if (!slugLocked) setSlug(slugify(next));
            }}
          />
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor={`${formId}-slug`}>Slug</FieldLabel>
            {slugLocked ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                onClick={() => {
                  setSlugLocked(false);
                  setSlug(slugify(name));
                }}
              >
                Auto from name
              </button>
            ) : (
              <span className="text-muted-foreground text-xs">Auto</span>
            )}
          </div>
          <Input
            id={`${formId}-slug`}
            name="slug"
            value={slug}
            required
            disabled={pending}
            onChange={(e) => {
              setSlugLocked(true);
              setSlug(e.target.value);
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-city`}>City</FieldLabel>
          <Input
            id={`${formId}-city`}
            name="city"
            defaultValue={location?.city}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-region`}>Region</FieldLabel>
          <Input
            id={`${formId}-region`}
            name="region"
            defaultValue={location?.region ?? ""}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-country`}>Country</FieldLabel>
          <Input
            id={`${formId}-country`}
            name="country"
            defaultValue={location?.country ?? "PH"}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-address`}>Address</FieldLabel>
          <Input
            id={`${formId}-address`}
            name="addressLine1"
            defaultValue={location?.address_line1 ?? ""}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-phone`}>Phone</FieldLabel>
          <Input
            id={`${formId}-phone`}
            name="phone"
            defaultValue={location?.phone ?? ""}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${formId}-sort`}>Sort order</FieldLabel>
          <Input
            id={`${formId}-sort`}
            name="sortOrder"
            type="number"
            defaultValue={location?.sort_order ?? 0}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-hours`}>Hours note</FieldLabel>
          <Input
            id={`${formId}-hours`}
            name="hoursNote"
            defaultValue={location?.hours_note ?? ""}
            disabled={pending}
          />
        </Field>
        <FormCheckbox
          className="sm:col-span-2"
          id={`${formId}-published`}
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
