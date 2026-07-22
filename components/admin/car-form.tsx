"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
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
        <p className="text-destructive text-sm">{error}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={car?.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={car?.slug} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class">Class</Label>
          <select
            id="class"
            name="class"
            defaultValue={car?.class ?? "economy"}
            className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
          >
            {CAR_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" defaultValue={car?.make} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={car?.model} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            type="number"
            defaultValue={car?.year ?? 2024}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dailyRatePesos">Daily rate (₱)</Label>
          <Input
            id="dailyRatePesos"
            name="dailyRatePesos"
            type="number"
            step="0.01"
            defaultValue={
              car ? centavosToPesos(car.daily_rate_cents) : 2500
            }
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seats">Seats</Label>
          <Input
            id="seats"
            name="seats"
            type="number"
            defaultValue={car?.seats ?? 5}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={car?.status ?? "available"}
            className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
          >
            <option value="available">available</option>
            <option value="maintenance">maintenance</option>
            <option value="retired">retired</option>
          </select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            defaultChecked={car?.is_published ?? false}
            className="size-4"
          />
          <Label htmlFor="isPublished">Published</Label>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="heroImageUrl">Hero image URL</Label>
          <Input
            id="heroImageUrl"
            name="heroImageUrl"
            defaultValue={car?.hero_image_url ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={car?.description ?? ""}
            rows={4}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Save car
      </Button>
    </form>
  );
}
