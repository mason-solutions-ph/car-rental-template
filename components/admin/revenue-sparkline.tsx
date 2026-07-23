import type { AdminPaidDailyPoint } from "@/lib/admin/revenue-series";
import { cn } from "@/lib/utils";

const W = 100;
const H = 32;
const PAD = 2;

/** Dependency-free inline-SVG sparkline; stroke follows currentColor. */
export function RevenueSparkline({
  points,
  metric = "revenueCents",
  className,
}: {
  points: AdminPaidDailyPoint[];
  metric?: "revenueCents" | "count";
  className?: string;
}) {
  const values = points.map((p) =>
    metric === "count" ? p.count : p.revenueCents
  );
  const max = Math.max(...values, 1);
  const coords =
    values.length > 1
      ? values.map((v, i) => {
          const x = (i / (values.length - 1)) * W;
          const y = PAD + (1 - v / max) * (H - PAD * 2);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
      : [`0,${H - PAD}`, `${W},${H - PAD}`];
  const last = coords[coords.length - 1].split(",");

  return (
    // Absolute svg in a sized wrapper: keeps the svg from contributing
    // intrinsic width, which would stretch flex/grid ancestors on mobile.
    <div className={cn("relative min-w-0", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden
        className="absolute inset-0 block h-full w-full"
      >
      <polygon
        points={`${coords.join(" ")} ${W},${H} 0,${H}`}
        fill="currentColor"
        fillOpacity={0.08}
        stroke="none"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
        <circle cx={last[0]} cy={last[1]} r={1.5} fill="currentColor" />
      </svg>
    </div>
  );
}
