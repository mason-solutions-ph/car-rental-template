"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const initial: ContactState = {};

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  return (
    <form action={action} className="relative flex flex-col gap-4">
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
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" required />
        </Field>
        {/* Honeypot — leave empty; bots often fill hidden fields */}
        <div
          className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <FieldLabel htmlFor="company">Company</FieldLabel>
          <Input
            id="company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <Field>
          <FieldLabel htmlFor="subject">Subject</FieldLabel>
          <Input id="subject" name="subject" />
        </Field>
        <Field>
          <FieldLabel htmlFor="message">Message</FieldLabel>
          <Textarea id="message" name="message" required rows={5} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Spinner /> : null}
        Send message
      </Button>
    </form>
  );
}
