"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Radix Select rejects empty string values; map "" ↔ this sentinel for form posts. */
const EMPTY = "__empty__";

export type FormSelectOption = {
  value: string;
  label: string;
};

export function FormSelect({
  name,
  defaultValue = "",
  options,
  placeholder,
  disabled,
  id,
  className,
  triggerClassName,
}: {
  name: string;
  defaultValue?: string;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  const selectValue = value === "" ? EMPTY : value;
  const items = options.map((o) =>
    o.value === "" ? { ...o, value: EMPTY } : o
  );

  return (
    <div className={cn("w-full", className)}>
      <input type="hidden" name={name} value={value} />
      <Select
        value={selectValue}
        onValueChange={(next) => setValue(next === EMPTY ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
