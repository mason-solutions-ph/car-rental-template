"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { uploadCarHeroImage } from "@/app/actions/cars";
import { ImageDropzone } from "@/components/admin/image-dropzone";
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
import { slugify } from "@/lib/format/slug";
import type { Car } from "@/types";

export function CarForm({
  car,
  action,
  onSuccess,
  formId,
  hideSubmit = false,
  onPendingChange,
}: {
  car?: Car | null;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  onSuccess?: () => void;
  formId?: string;
  hideSubmit?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const autoId = useId();
  const id = formId ?? `car-form-${autoId}`;
  const isEdit = Boolean(car?.id);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(car?.name ?? "");
  const [slug, setSlug] = useState(car?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [heroImageUrl, setHeroImageUrl] = useState(car?.hero_image_url ?? "");

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const pesos = Number(fd.get("dailyRatePesos"));
    fd.set("dailyRateCents", String(pesosToCentavos(pesos)));
    fd.set("heroImageUrl", heroImageUrl);
    fd.set("slug", slug);
    fd.set("name", name);
    try {
      const result = await action(fd);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Car updated" : "Car created");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save car.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
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
            <FieldLabel htmlFor={`${id}-slug`}>Slug</FieldLabel>
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
            id={`${id}-slug`}
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
          <FieldLabel htmlFor={`${id}-class`}>Class</FieldLabel>
          <FormSelect
            id={`${id}-class`}
            name="class"
            defaultValue={car?.class ?? "economy"}
            options={CAR_CLASSES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-make`}>Make</FieldLabel>
          <Input
            id={`${id}-make`}
            name="make"
            defaultValue={car?.make}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-model`}>Model</FieldLabel>
          <Input
            id={`${id}-model`}
            name="model"
            defaultValue={car?.model}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-year`}>Year</FieldLabel>
          <Input
            id={`${id}-year`}
            name="year"
            type="number"
            defaultValue={car?.year ?? 2024}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-rate`}>Daily rate (₱)</FieldLabel>
          <Input
            id={`${id}-rate`}
            name="dailyRatePesos"
            type="number"
            step="0.01"
            defaultValue={car ? centavosToPesos(car.daily_rate_cents) : 2500}
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-seats`}>Seats</FieldLabel>
          <Input
            id={`${id}-seats`}
            name="seats"
            type="number"
            defaultValue={car?.seats ?? 5}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-status`}>Status</FieldLabel>
          <FormSelect
            id={`${id}-status`}
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
          id={`${id}-published`}
          name="isPublished"
          defaultChecked={car?.is_published ?? false}
          label="Published"
        />
        <Field className="sm:col-span-2">
          <FieldLabel>Hero image</FieldLabel>
          <ImageDropzone
            id={`${id}-hero`}
            name="heroImageUrl"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            upload={uploadCarHeroImage}
            disabled={pending}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
          <Textarea
            id={`${id}-description`}
            name="description"
            defaultValue={car?.description ?? ""}
            rows={4}
            disabled={pending}
          />
        </Field>
      </FieldGroup>
      {!hideSubmit ? (
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? <Spinner /> : null}
          Save car
        </Button>
      ) : null}
    </form>
  );
}
