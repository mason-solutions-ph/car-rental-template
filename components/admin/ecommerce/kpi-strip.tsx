"use client";

import {
  ArrowUpRight,
  Car,
  DollarSign,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { AdminOverview } from "@/lib/admin/overview";
import { formatMoney } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

const revenueOverviewConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--foreground)",
  },
  bookings: {
    label: "Bookings",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig;

function formatDayTick(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatTooltipLabel(value: string) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(d);
}

function DeltaLine({
  deltaLabel,
  deltaPositive,
  hint,
}: {
  deltaLabel: string;
  deltaPositive: boolean | null;
  hint: string;
}) {
  return (
    <div className="text-sm">
      <span
        className={cn(
          deltaPositive === null && "text-muted-foreground",
          deltaPositive === true && "text-green-700 dark:text-green-300",
          deltaPositive === false && "text-destructive"
        )}
      >
        {deltaLabel}
      </span>
      <span className="text-muted-foreground"> {hint}</span>
    </div>
  );
}

function KpiCard({
  title,
  value,
  deltaLabel,
  deltaPositive,
  hint,
  icon: Icon,
  className,
}: {
  title: string;
  value: string;
  deltaLabel: string;
  deltaPositive: boolean | null;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn("h-full rounded-none border-0 border-border ring-0", className)}>
      <CardHeader>
        <CardTitle className="font-normal text-sm">{title}</CardTitle>
        <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
          {value}
        </CardDescription>
        <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
          <Icon className="size-3 text-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <DeltaLine deltaLabel={deltaLabel} deltaPositive={deltaPositive} hint={hint} />
      </CardContent>
    </Card>
  );
}

export function KpiStrip({ data }: { data: AdminOverview }) {
  const { kpis, revenueSeries } = data;
  const maxRevenue = Math.max(1, ...revenueSeries.map((p) => p.revenue));
  const maxBookings = Math.max(1, ...revenueSeries.map((p) => p.bookings));

  return (
    <div className="h-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 xl:col-span-12">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
          <KpiCard
            title={kpis.revenue.label}
            value={kpis.revenue.value}
            deltaLabel={kpis.revenue.deltaLabel}
            deltaPositive={kpis.revenue.deltaPositive}
            hint={kpis.revenue.hint}
            icon={DollarSign}
            className="border-b md:border-r"
          />
          <KpiCard
            title={kpis.bookings.label}
            value={kpis.bookings.value}
            deltaLabel={kpis.bookings.deltaLabel}
            deltaPositive={kpis.bookings.deltaPositive}
            hint={kpis.bookings.hint}
            icon={ShoppingBag}
            className="border-b"
          />
          <KpiCard
            title={kpis.customers.label}
            value={kpis.customers.value}
            deltaLabel={kpis.customers.deltaLabel}
            deltaPositive={kpis.customers.deltaPositive}
            hint={kpis.customers.hint}
            icon={Users}
            className="border-b md:border-r"
          />
          <KpiCard
            title={kpis.average.label}
            value={kpis.average.value}
            deltaLabel={kpis.average.deltaLabel}
            deltaPositive={kpis.average.deltaPositive}
            hint={kpis.average.hint}
            icon={ReceiptText}
            className="border-b"
          />
          <KpiCard
            title={kpis.cancelled.label}
            value={kpis.cancelled.value}
            deltaLabel={kpis.cancelled.deltaLabel}
            deltaPositive={
              kpis.cancelled.deltaPositive === null
                ? null
                : !kpis.cancelled.deltaPositive
            }
            hint={kpis.cancelled.hint}
            icon={RotateCcw}
            className="border-b md:border-r md:border-b-0"
          />
          <KpiCard
            title={kpis.fleetAvailable.label}
            value={kpis.fleetAvailable.value}
            deltaLabel={kpis.fleetAvailable.deltaLabel}
            deltaPositive={kpis.fleetAvailable.deltaPositive}
            hint={kpis.fleetAvailable.hint}
            icon={Car}
          />
        </div>

        <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
          <CardHeader>
            <CardTitle className="font-normal">Revenue overview</CardTitle>
            <CardAction>
              <a href="/admin/bookings?payment=paid" aria-label="View paid bookings">
                <ArrowUpRight className="size-4" />
              </a>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueOverviewConfig} className="h-74 w-full">
              <ComposedChart
                accessibilityLayer
                data={revenueSeries}
                margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
              >
                <defs>
                  <filter id="sales-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood floodColor="var(--color-revenue)" floodOpacity="0.35" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid yAxisId="bookings" vertical={false} />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  height={30}
                  minTickGap={28}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={formatDayTick}
                />
                <YAxis yAxisId="revenue" hide domain={[0, maxRevenue * 1.1]} />
                <YAxis yAxisId="bookings" hide domain={[0, maxBookings * 2]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-44"
                      labelFormatter={(value) => formatTooltipLabel(String(value))}
                      formatter={(value, name, item) => (
                        <>
                          <div
                            className="size-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex flex-1 items-center justify-between leading-none">
                            <span className="text-muted-foreground">{String(name ?? "")}</span>
                            <span className="font-medium font-mono text-foreground tabular-nums">
                              {name === "Revenue"
                                ? formatMoney(typeof value === "number" ? value : 0)
                                : String(value ?? "")}
                            </span>
                          </div>
                        </>
                      )}
                    />
                  }
                  cursor={{
                    stroke: "var(--border)",
                    strokeDasharray: "4 4",
                  }}
                />
                <Bar
                  yAxisId="bookings"
                  barSize={4}
                  dataKey="bookings"
                  fill="var(--color-bookings)"
                  name="Bookings"
                  opacity={0.18}
                  radius={[6, 6, 0, 0]}
                />
                <Area
                  yAxisId="revenue"
                  dataKey="revenue"
                  fill="none"
                  filter="url(#sales-line-glow)"
                  name="Revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={1.8}
                  type="linear"
                  activeDot={{
                    r: 4,
                    fill: "var(--background)",
                    stroke: "var(--color-revenue)",
                    strokeWidth: 2,
                  }}
                  dot={false}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
