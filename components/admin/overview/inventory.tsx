"use client";

import { ArrowUpRight, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import type { OverviewFleetInventory } from "@/lib/admin/overview";

const chartConfig = {
  available: {
    label: "Available",
    color: "var(--chart-2)",
  },
  maintenance: {
    label: "Maintenance",
    color: "var(--chart-1)",
  },
  retired: {
    label: "Retired",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

export function Inventory({ fleet }: { fleet: OverviewFleetInventory }) {
  const totalUnits =
    fleet.available + fleet.maintenance + fleet.retired || 1;
  const gaugeSegmentCount = 32;
  const availableSegments = Math.round((fleet.available / totalUnits) * gaugeSegmentCount);
  const maintenanceSegments = Math.round(
    (fleet.maintenance / totalUnits) * gaugeSegmentCount
  );

  function getGaugeSegmentStatus(index: number) {
    if (index < availableSegments) return "available";
    if (index < availableSegments + maintenanceSegments) return "maintenance";
    return "retired";
  }

  const gaugeSegments = Array.from({ length: gaugeSegmentCount }, (_, index) => {
    const status = getGaugeSegmentStatus(index);
    return {
      fill: `var(--color-${status})`,
      id: `segment-${index + 1}`,
      status,
      value: 1,
    };
  });

  const inventorySummary = [
    { icon: PackageCheck, label: "Available", value: fleet.available },
    { icon: TriangleAlert, label: "Service", value: fleet.maintenance },
    { icon: PackageX, label: "Retired", value: fleet.retired },
  ] as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Fleet</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {fleet.availablePercent}% available
        </CardDescription>
        <CardAction>
          <a href="/admin/cars" aria-label="View fleet">
            <ArrowUpRight className="size-4" />
          </a>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="mx-auto h-30 w-full">
          <PieChart>
            <Pie
              cx="50%"
              cy="100%"
              cornerRadius={6}
              data={gaugeSegments}
              dataKey="value"
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              startAngle={180}
              stroke="var(--card)"
              strokeWidth={1}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan
                          className="fill-foreground font-medium text-2xl tabular-nums"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                        >
                          {fleet.availablePercent}%
                        </tspan>
                        <tspan
                          className="fill-muted-foreground text-xs"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 38}
                        >
                          Available
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <Separator />

        <div className="grid grid-cols-3 divide-x">
          {inventorySummary.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-9 place-items-center rounded-full bg-muted">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs leading-none">{item.label}</div>
                <div className="font-medium text-sm tabular-nums">
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
