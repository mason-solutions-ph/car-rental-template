import { OpsPanel } from "@/components/admin/ops-panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Loading placeholders for the streamed dashboard sections.
 *
 * Geometry is matched to the real content on purpose: these render inside
 * Suspense boundaries, so any size mismatch becomes visible layout shift the
 * moment data arrives. Row heights and column counts must track the components
 * they stand in for.
 */

function StatCellSkeleton({
  hint = false,
  className,
}: {
  hint?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-card flex flex-col gap-1 px-4 py-3 ${className ?? ""}`}>
      <Skeleton className="h-4 w-14 rounded-sm" />
      <Skeleton className="h-7 w-16 rounded-sm" />
      {hint ? <Skeleton className="h-4 w-20 rounded-sm" /> : null}
    </div>
  );
}

/** Mirrors StatsTicker: 8 columns with two col-span-2 cells, hairline gaps. */
export function StatsTickerSkeleton() {
  return (
    <OpsPanel className="bg-transparent">
      <div className="bg-border grid grid-cols-2 gap-px sm:grid-cols-4 xl:grid-cols-8">
        <StatCellSkeleton />
        <StatCellSkeleton hint />
        <StatCellSkeleton hint className="col-span-2" />
        <StatCellSkeleton />
        <StatCellSkeleton />
        <div className="bg-card col-span-2 flex flex-col gap-1 px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-10 rounded-sm" />
            <Skeleton className="h-4 w-8 rounded-sm" />
          </div>
          <Skeleton className="h-8 w-full rounded-sm" />
        </div>
      </div>
    </OpsPanel>
  );
}

/**
 * Table placeholder. Body cells are h-5 inside p-2, which reproduces the 36px
 * row height of a real 13px table row.
 */
export function OpsTableSkeleton({
  columns,
  rows = 4,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <OpsPanel>
      <Table className="text-ui">
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }, (_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-3 w-16 rounded-sm" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, r) => (
            <TableRow key={r}>
              {Array.from({ length: columns }, (_, c) => (
                <TableCell key={c}>
                  <Skeleton className="h-5 w-full max-w-24 rounded-sm" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </OpsPanel>
  );
}

/** Matches RevenueAreaChart's h-56 plot area plus the panel's p-4. */
export function OpsChartSkeleton() {
  return (
    <OpsPanel className="p-4">
      <Skeleton className="h-56 w-full rounded-sm" />
    </OpsPanel>
  );
}

/** Placeholder for the divided inbox list: name/email row, subject, message. */
export function OpsListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <OpsPanel divided>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="h-4 w-28 rounded-sm" />
          </div>
          <Skeleton className="h-5 w-52 rounded-sm" />
          <Skeleton className="h-5 w-full rounded-sm" />
        </div>
      ))}
    </OpsPanel>
  );
}
