"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminPaidDailyPoint } from "@/lib/admin/revenue-series";
import { formatMoney } from "@/lib/format/currency";

/**
 * Single-series monochrome area chart. chart-1 is the most prominent step of
 * the ramp in both themes, so the series reads correctly on light and dark.
 */
const chartConfig = {
  revenueCents: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const dayFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Series dates are UTC calendar days ("YYYY-MM-DD"), so parse and format as UTC. */
function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : dayFormat.format(d);
}

function formatAxisMoney(cents: number): string {
  const pesos = cents / 100;
  if (pesos >= 1000) return `${Math.round(pesos / 1000)}k`;
  return String(Math.round(pesos));
}

export function RevenueAreaChart({
  points,
}: {
  points: AdminPaidDailyPoint[];
}) {
  return (
    // An explicit height is required. Without a resolved size the responsive
    // container reports -1x-1, never binds mouse handlers, and the chart draws
    // but tooltips silently never fire.
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <AreaChart data={points} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="ops-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-revenueCents)"
              stopOpacity={0.22}
            />
            <stop
              offset="100%"
              stopColor="var(--color-revenueCents)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatDay}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={44}
          tickFormatter={(value) => formatAxisMoney(Number(value))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatDay(String(value))}
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatMoney(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="revenueCents"
          type="monotone"
          stroke="var(--color-revenueCents)"
          strokeWidth={1.5}
          fill="url(#ops-revenue-fill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
