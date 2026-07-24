"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

/**
 * Theme control for the console chrome.
 *
 * No `mounted` guard, deliberately. The trigger's icon swap is pure CSS
 * (dark:hidden / dark:block) so server and client HTML are byte-identical, and
 * the only value read from useTheme is `theme`, which is read inside
 * DropdownMenuContent. Radix mounts that lazily in a portal on open, always
 * after hydration. A mounted guard here would add a flash, not remove one.
 *
 * Do NOT add forceMount to the content: that reintroduces the mismatch.
 *
 * Uses `theme` rather than `resolvedTheme` so System is selectable and shows
 * as checked when active.
 */
export function OpsThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Change theme"
        >
          <SunIcon className="size-3.5 dark:hidden" strokeWidth={1.5} />
          <MoonIcon className="hidden size-3.5 dark:block" strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {MODES.map((mode) => (
            <DropdownMenuRadioItem
              key={mode.value}
              value={mode.value}
              className="text-ui"
            >
              {mode.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
