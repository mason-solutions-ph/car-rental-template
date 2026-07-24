"use client";

import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { OverviewActivityPoint } from "@/lib/admin/overview";

const trafficConfig = {
  bookings: {
    label: "Bookings",
    color: "var(--chart-3)",
  },
  unpaid: {
    label: "Unpaid holds",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

function formatDay(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function BookingActivity({
  series,
  total,
}: {
  series: OverviewActivityPoint[];
  total: number;
}) {
  const first = series[0]?.date ?? "";
  const last = series.at(-1)?.date ?? "";
  const maxY = Math.max(5, ...series.map((p) => Math.max(p.bookings, p.unpaid)));

  function formatTick(value: string) {
    if (value === first) return "30d ago";
    if (value === last) return "now";
    return "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">
          Booking activity
        </CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {total.toLocaleString()} created (30d)
        </CardDescription>
        <CardAction>
          <a href="/admin/bookings" aria-label="View bookings">
            <ArrowUpRight className="size-4" />
          </a>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={trafficConfig} className="h-54 w-full">
          <AreaChart
            accessibilityLayer
            data={series}
            margin={{ bottom: 0, left: 0, right: 0, top: 8 }}
          >
            <defs>
              <linearGradient id="fillBookings" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={formatTick}
              tickLine={false}
              tickMargin={10}
              ticks={first && last ? [first, last] : undefined}
            />
            <YAxis
              axisLine={false}
              domain={[0, maxY]}
              tickLine={false}
              tickMargin={6}
              width={36}
              yAxisId="traffic"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} />
              }
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            />
            <ChartLegend
              align="right"
              verticalAlign="top"
              content={<ChartLegendContent className="justify-end" />}
            />
            <Area
              dataKey="bookings"
              dot={false}
              fill="url(#fillBookings)"
              stroke="var(--color-bookings)"
              strokeWidth={2}
              type="monotone"
              yAxisId="traffic"
            />
            <Line
              dataKey="unpaid"
              dot={false}
              stroke="var(--color-unpaid)"
              strokeLinecap="round"
              strokeWidth={1.2}
              type="monotone"
              yAxisId="traffic"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
