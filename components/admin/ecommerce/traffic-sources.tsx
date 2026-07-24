"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { OverviewStatusShare } from "@/lib/admin/overview";

const statusConfig = {
  share: {
    label: "Share",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type NameLabelProps = LabelProps & { index?: number };
type ChangeLabelProps = LabelProps & { value?: number | string };

function getNumber(value: number | string | undefined) {
  return typeof value === "number" ? value : Number(value);
}

function StatusNameLabel({
  height,
  index,
  y,
  data,
}: NameLabelProps & { data: OverviewStatusShare[] }) {
  if (typeof index !== "number") return null;
  const source = data[index];
  const yValue = getNumber(y);
  const heightValue = getNumber(height);
  if (!source || Number.isNaN(yValue) || Number.isNaN(heightValue)) return null;

  return (
    <text dominantBaseline="middle" textAnchor="start" x={2} y={yValue + heightValue / 2}>
      <tspan className="fill-foreground font-medium" fontSize={13} x={2} y={yValue + heightValue / 2 - 7}>
        {source.name}
      </tspan>
      <tspan className="fill-muted-foreground" fontSize={12} x={2} y={yValue + heightValue / 2 + 11}>
        {source.visits} bookings
      </tspan>
    </text>
  );
}

function StatusChangeLabel({ height, value, y }: ChangeLabelProps) {
  const yValue = getNumber(y);
  const heightValue = getNumber(height);
  if (typeof value !== "string" || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
    return null;
  }
  const isNegative = value.startsWith("-");
  const isNeutral = value === "—";

  return (
    <text
      className={
        isNeutral
          ? "fill-muted-foreground"
          : isNegative
            ? "fill-destructive"
            : "fill-green-700 dark:fill-green-300"
      }
      dominantBaseline="middle"
      dx={-6}
      fontSize={13}
      textAnchor="end"
      x="100%"
      y={yValue + heightValue / 2}
    >
      {value}
    </text>
  );
}

export function TrafficSources({
  shares,
  total,
}: {
  shares: OverviewStatusShare[];
  total: number;
}) {
  const chartData =
    shares.length > 0
      ? shares
      : [{ name: "No bookings", count: 0, visits: "0", share: 0, change: "—" }];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">
          Booking status
        </CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {total.toLocaleString()} in period
        </CardDescription>
        <CardAction>
          <a href="/admin/bookings" aria-label="View bookings">
            <ArrowUpRight className="size-4" />
          </a>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={statusConfig} className="h-54 w-full">
          <BarChart
            accessibilityLayer
            barCategoryGap={12}
            data={chartData}
            layout="vertical"
            margin={{ bottom: 0, left: 100, right: 50, top: 0 }}
          >
            <defs>
              <pattern
                height="4"
                id="booking-status-background-pattern"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
                width="4"
              >
                <rect height="6" width="6" fill="var(--muted)" fillOpacity="0.5" />
                <line
                  stroke="var(--muted-foreground)"
                  strokeOpacity="0.10"
                  strokeWidth="1.25"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="6"
                />
              </pattern>
            </defs>
            <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
            <YAxis dataKey="name" hide type="category" />
            <Bar
              background={{ fill: "url(#booking-status-background-pattern)", radius: 8 }}
              barSize={36}
              dataKey="share"
              fill="var(--color-share)"
              fillOpacity={0.5}
              name="Share"
              radius={8}
              stroke="var(--color-share)"
              strokeOpacity={0.1}
              strokeWidth={0.5}
            >
              <LabelList
                content={<StatusNameLabel data={chartData} />}
                dataKey="name"
              />
              <LabelList content={<StatusChangeLabel />} dataKey="change" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
