"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BanknoteIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { createAdminOnsiteCashBooking } from "@/app/actions/admin-bookings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { quoteRental } from "@/lib/cars/pricing";
import { formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export type OnsiteCarOption = {
  id: string;
  name: string;
  daily_rate_cents: number;
  is_published: boolean;
  status: string;
};

export function AddOnsiteBookingDialog({
  cars,
  locationId,
  locationName,
  defaultOpen = false,
}: {
  cars: OnsiteCarOption[];
  locationId: string;
  locationName: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bookableCars = useMemo(
    () =>
      cars.filter((c) => c.is_published && c.status === "available"),
    [cars],
  );

  const [carId, setCarId] = useState(bookableCars[0]?.id ?? "");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("10:00");

  const selectedCar = bookableCars.find((c) => c.id === carId) ?? null;

  const estimate = useMemo(() => {
    if (!selectedCar || !pickupDate || !dropoffDate) return null;
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const dropoff = new Date(`${dropoffDate}T${dropoffTime}`);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime())) {
      return null;
    }
    const quote = quoteRental(
      selectedCar.daily_rate_cents,
      pickup,
      dropoff,
    );
    return quote.ok
      ? { rentalDays: quote.rentalDays, totalCents: quote.totalCents }
      : null;
  }, [selectedCar, pickupDate, pickupTime, dropoffDate, dropoffTime]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAdminOnsiteCashBooking(fd);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
      if (result.bookingId) {
        router.push(`/admin/bookings?booking=${result.bookingId}`);
      }
    });
  }

  if (!locationId) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        <PlusIcon data-icon="inline-start" />
        Add booking
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <PlusIcon data-icon="inline-start" />
          Add booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Onsite booking (cash)</DialogTitle>
          <DialogDescription>
            Walk-in rental paid at the counter. Marks the booking paid and
            confirmed — no PayMongo checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="locationId" value={locationId} />
          <input type="hidden" name="pickupLocationId" value={locationId} />
          <input type="hidden" name="dropoffLocationId" value={locationId} />

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="bg-muted/40 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
            <BanknoteIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Payment: Cash</p>
              <p className="text-muted-foreground text-xs">
                Location: {locationName}
              </p>
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="onsite-car">Car</FieldLabel>
            <select
              id="onsite-car"
              name="carId"
              required
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className={cn(
                "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              {bookableCars.length === 0 ? (
                <option value="">No published cars available</option>
              ) : null}
              {bookableCars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {formatMoney(c.daily_rate_cents)}/day
                </option>
              ))}
            </select>
          </Field>

          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pickupDate">Pickup date</FieldLabel>
              <Input
                id="pickupDate"
                name="pickupDate"
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pickupTime">Pickup time</FieldLabel>
              <Input
                id="pickupTime"
                name="pickupTime"
                type="time"
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dropoffDate">Drop-off date</FieldLabel>
              <Input
                id="dropoffDate"
                name="dropoffDate"
                type="date"
                required
                value={dropoffDate}
                onChange={(e) => setDropoffDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dropoffTime">Drop-off time</FieldLabel>
              <Input
                id="dropoffTime"
                name="dropoffTime"
                type="time"
                required
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
              />
            </Field>
          </FieldGroup>

          {estimate ? (
            <p className="text-muted-foreground text-sm">
              Estimate:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {estimate.rentalDays} day{estimate.rentalDays === 1 ? "" : "s"} ·{" "}
                {formatMoney(estimate.totalCents)}
              </span>
            </p>
          ) : null}

          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="driverFullName">Driver name</FieldLabel>
              <Input
                id="driverFullName"
                name="driverFullName"
                required
                minLength={2}
                autoComplete="name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="driverPhone">Phone</FieldLabel>
              <Input
                id="driverPhone"
                name="driverPhone"
                type="tel"
                required
                minLength={7}
                autoComplete="tel"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="driverLicenseNumber">License no.</FieldLabel>
              <Input
                id="driverLicenseNumber"
                name="driverLicenseNumber"
                required
                minLength={3}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="customerNote">Note (optional)</FieldLabel>
              <Textarea
                id="customerNote"
                name="customerNote"
                rows={2}
                maxLength={500}
                placeholder="e.g. received ₱ cash at desk"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || bookableCars.length === 0}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Create & mark paid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
