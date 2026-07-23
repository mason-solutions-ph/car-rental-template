"use client";

import { useActionState } from "react";
import {
  createBookingAndCheckout,
  type BookingActionState,
} from "@/app/actions/bookings";
import { FormSelect } from "@/components/forms/form-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
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

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: l.name,
  }));
  const defaultPickup = defaults.pickupLocationId ?? locations[0]?.id ?? "";
  const defaultDropoff = defaults.dropoffLocationId ?? locations[0]?.id ?? "";

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="carId" value={carId} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-base">{carName}</CardTitle>
          <CardDescription>
            {formatMoney(dailyRateCents)} / day
            {estimate
              ? ` · ${estimate.rentalDays} day(s) · ${formatMoney(estimate.totalCents)} total`
              : null}
          </CardDescription>
        </CardHeader>
      </Card>

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="pickupLocationId">Pickup location</FieldLabel>
          <FormSelect
            id="pickupLocationId"
            name="pickupLocationId"
            defaultValue={defaultPickup}
            options={locationOptions}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dropoffLocationId">Drop-off location</FieldLabel>
          <FormSelect
            id="dropoffLocationId"
            name="dropoffLocationId"
            defaultValue={defaultDropoff}
            options={locationOptions}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="pickupDate">Pickup date</FieldLabel>
          <Input
            id="pickupDate"
            name="pickupDate"
            type="date"
            required
            defaultValue={defaults.pickupDate}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="pickupTime">Pickup time</FieldLabel>
          <Input
            id="pickupTime"
            name="pickupTime"
            type="time"
            required
            defaultValue={defaults.pickupTime ?? "10:00"}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dropoffDate">Drop-off date</FieldLabel>
          <Input
            id="dropoffDate"
            name="dropoffDate"
            type="date"
            required
            defaultValue={defaults.dropoffDate}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="dropoffTime">Drop-off time</FieldLabel>
          <Input
            id="dropoffTime"
            name="dropoffTime"
            type="time"
            required
            defaultValue={defaults.dropoffTime ?? "10:00"}
          />
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="driverFullName">Driver full name</FieldLabel>
          <Input id="driverFullName" name="driverFullName" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="driverPhone">Phone</FieldLabel>
          <Input id="driverPhone" name="driverPhone" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="driverLicenseNumber">License number</FieldLabel>
          <Input id="driverLicenseNumber" name="driverLicenseNumber" required />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="customerNote">Note (optional)</FieldLabel>
          <Textarea id="customerNote" name="customerNote" rows={3} />
        </Field>
      </FieldGroup>

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
