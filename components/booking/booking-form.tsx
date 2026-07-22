"use client";

import { useActionState } from "react";
import {
  createBookingAndCheckout,
  type BookingActionState,
} from "@/app/actions/bookings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { formatMoney } from "@/lib/format/currency";
import type { Location } from "@/types";

const initial: BookingActionState = {};

export function BookingForm({
  carId,
  carName,
  dailyRateCents,
  locations,
  defaults,
  estimate,
}: {
  carId: string;
  carName: string;
  dailyRateCents: number;
  locations: Location[];
  defaults: {
    pickupLocationId?: string;
    dropoffLocationId?: string;
    pickupDate?: string;
    dropoffDate?: string;
    pickupTime?: string;
    dropoffTime?: string;
  };
  estimate: {
    rentalDays: number;
    totalCents: number;
  } | null;
}) {
  const [state, action, pending] = useActionState(
    createBookingAndCheckout,
    initial
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="carId" value={carId} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border p-4">
        <p className="font-medium">{carName}</p>
        <p className="text-muted-foreground text-sm">
          {formatMoney(dailyRateCents)} / day
          {estimate
            ? ` · ${estimate.rentalDays} day(s) · ${formatMoney(estimate.totalCents)} total`
            : null}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pickupLocationId">Pickup location</Label>
          <select
            id="pickupLocationId"
            name="pickupLocationId"
            required
            defaultValue={defaults.pickupLocationId ?? locations[0]?.id}
            className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dropoffLocationId">Drop-off location</Label>
          <select
            id="dropoffLocationId"
            name="dropoffLocationId"
            required
            defaultValue={defaults.dropoffLocationId ?? locations[0]?.id}
            className="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pickupDate">Pickup date</Label>
          <Input
            id="pickupDate"
            name="pickupDate"
            type="date"
            required
            defaultValue={defaults.pickupDate}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pickupTime">Pickup time</Label>
          <Input
            id="pickupTime"
            name="pickupTime"
            type="time"
            required
            defaultValue={defaults.pickupTime ?? "10:00"}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dropoffDate">Drop-off date</Label>
          <Input
            id="dropoffDate"
            name="dropoffDate"
            type="date"
            required
            defaultValue={defaults.dropoffDate}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dropoffTime">Drop-off time</Label>
          <Input
            id="dropoffTime"
            name="dropoffTime"
            type="time"
            required
            defaultValue={defaults.dropoffTime ?? "10:00"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="driverFullName">Driver full name</Label>
          <Input id="driverFullName" name="driverFullName" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="driverPhone">Phone</Label>
          <Input id="driverPhone" name="driverPhone" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="driverLicenseNumber">License number</Label>
          <Input id="driverLicenseNumber" name="driverLicenseNumber" required />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="customerNote">Note (optional)</Label>
          <Textarea id="customerNote" name="customerNote" rows={3} />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner /> : null}
        Pay with PayMongo
      </Button>
      <p className="text-muted-foreground text-xs">
        You will be redirected to PayMongo hosted checkout (card, GCash, Maya,
        and more). Amounts are in PHP.
      </p>
    </form>
  );
}
