"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { OverviewPeriod } from "@/lib/admin/overview-period";

export function OverviewToolbar({ period }: { period: OverviewPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPeriod(next: string | null) {
    if (!next) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-34" id="overview-period" size="sm">
          <SelectValue placeholder="Last 30 Days" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-30-days">Last 30 Days</SelectItem>
            <SelectItem value="year-to-date">Year to Date</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="hidden h-7 sm:block" />

      <Button size="icon-sm" variant="outline" asChild>
        <a href="/admin/bookings" aria-label="Open bookings">
          <Settings2 />
        </a>
      </Button>
    </div>
  );
}
