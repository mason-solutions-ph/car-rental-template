"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Car,
  Clock,
  DollarSign,
  ReceiptText,
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
import type { AdminOverview, OverviewKpi } from "@/lib/admin/overview";
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
  attention,
}: {
  deltaLabel: string;
  deltaPositive: boolean | null;
  hint: string;
  attention?: boolean;
}) {
  return (
    <div className="text-sm">
      <span
        className={cn(
          attention && "text-attention",
          !attention && deltaPositive === null && "text-muted-foreground",
          !attention && deltaPositive === true && "text-green-700 dark:text-green-300",
          !attention && deltaPositive === false && "text-destructive"
        )}
      >
        {deltaLabel}
      </span>
      <span className="text-muted-foreground"> {hint}</span>
    </div>
  );
}

function KpiCard({
  kpi,
  icon: Icon,
  className,
}: {
  kpi: OverviewKpi;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const body = (
    <>
      <CardHeader>
        <CardTitle
          className={cn(
            "font-normal text-sm",
            kpi.attention && "text-attention"
          )}
        >
          {kpi.label}
        </CardTitle>
        <CardDescription
          className={cn(
            "text-3xl tabular-nums leading-none tracking-tight",
            kpi.attention ? "text-attention" : "text-foreground"
          )}
        >
          {kpi.value}
        </CardDescription>
        <CardAction
          className={cn(
            "grid size-6 place-items-center rounded-sm",
            kpi.attention ? "bg-attention/15" : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "size-3",
              kpi.attention ? "text-attention" : "text-foreground"
            )}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <DeltaLine
          deltaLabel={kpi.deltaLabel}
          deltaPositive={kpi.deltaPositive}
          hint={kpi.hint}
          attention={kpi.attention}
        />
      </CardContent>
    </>
  );

  if (kpi.href) {
    return (
      <Card
        className={cn(
          "h-full rounded-none border-0 border-border ring-0 transition-colors hover:bg-muted/30",
          className
        )}
      >
        <Link href={kpi.href} className="contents">
          {body}
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "h-full rounded-none border-0 border-border ring-0",
        className
      )}
    >
      {body}
    </Card>
  );
}

export function KpiStrip({ data }: { data: AdminOverview }) {
  const { kpis, revenueSeries } = data;
  const maxRevenue = Math.max(1, ...revenueSeries.map((p) => p.revenue));
  const maxBookings = Math.max(1, ...revenueSeries.map((p) => p.bookings));
  const hasRevenue = revenueSeries.some((p) => p.revenue > 0 || p.bookings > 0);

  return (
    <div className="h-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 xl:col-span-12">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
          <KpiCard kpi={kpis.revenue} icon={DollarSign} className="border-b md:border-r" />
          <KpiCard kpi={kpis.bookings} icon={ShoppingBag} className="border-b" />
          <KpiCard kpi={kpis.unpaid} icon={Clock} className="border-b md:border-r" />
          <KpiCard kpi={kpis.average} icon={ReceiptText} className="border-b" />
          <KpiCard
            kpi={kpis.customers}
            icon={Users}
            className="border-b md:border-r md:border-b-0"
          />
          <KpiCard kpi={kpis.fleetAvailable} icon={Car} />
        </div>

        <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
          <CardHeader>
            <CardTitle className="font-normal">Revenue overview</CardTitle>
            <CardAction>
              <Link href="/admin/bookings?payment=paid" aria-label="View paid bookings">
                <ArrowUpRight className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {!hasRevenue ? (
              <div className="text-muted-foreground flex h-74 items-center justify-center text-sm">
                {data.demo
                  ? "Paid revenue charts when Supabase bookings are live."
                  : "No paid bookings in the last 30 days."}
              </div>
            ) : (
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
                              <span className="text-muted-foreground">
                                {String(name ?? "")}
                              </span>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
