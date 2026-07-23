"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Checkbox that posts like a native checkbox: only includes `name=on` when checked.
 * Matches server actions that use `formData.get(name) === "on"`.
 */
export function FormCheckbox({
  name,
  id,
  defaultChecked = false,
  label,
  className,
}: {
  name: string;
  id?: string;
  defaultChecked?: boolean;
  label: React.ReactNode;
  className?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const inputId = id ?? name;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {checked ? <input type="hidden" name={name} value="on" /> : null}
      <Checkbox
        id={inputId}
        checked={checked}
        onCheckedChange={(next) => setChecked(next === true)}
      />
      <Label htmlFor={inputId} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
