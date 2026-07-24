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
 * Loading placeholders for streamed dashboard sections.
 * Geometry tracks the real tables so Suspense swaps don't shift layout.
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
