"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaults.fullName ?? ""}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="licenseNumber">License number</Label>
        <Input
          id="licenseNumber"
          name="licenseNumber"
          defaultValue={defaults.licenseNumber ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Save
      </Button>
    </form>
  );
}
