"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const initial: ProfileState = {};

export function ProfileForm({
  defaults,
}: {
  defaults: {
    fullName?: string | null;
    phone?: string | null;
    licenseNumber?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={defaults.fullName ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} />
        </Field>
        <Field>
          <FieldLabel htmlFor="licenseNumber">License number</FieldLabel>
          <Input
            id="licenseNumber"
            name="licenseNumber"
            defaultValue={defaults.licenseNumber ?? ""}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Save
      </Button>
    </form>
  );
}
