import Link from "next/link";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminCars } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/format/currency";

export const metadata = { title: "Admin cars" };

const headClass =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

export default async function AdminCarsPage() {
  const cars = await listAdminCars();

  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader
        eyebrow="Fleet"
        title="Cars"
        actions={
          <Button asChild size="sm">
            <Link href="/admin/cars/new">Add car</Link>
          </Button>
        }
      />
      {cars.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No cars yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a car to publish it on the fleet page.
          </p>
          {isSupabaseConfigured() ? (
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/cars/new">Add car</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={headClass}>Name</TableHead>
                  <TableHead className={headClass}>Class</TableHead>
                  <TableHead className={headClass}>Rate</TableHead>
                  <TableHead className={headClass}>Published</TableHead>
                  <TableHead className={headClass}>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">{car.name}</TableCell>
                    <TableCell className="capitalize">{car.class}</TableCell>
                    <TableCell className="font-mono text-[13px] tabular-nums">
                      {formatMoney(car.daily_rate_cents)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={car.is_published ? "default" : "secondary"}
                      >
                        {car.is_published ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{car.status}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/cars/${car.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {!isSupabaseConfigured() ? (
        <p className="text-muted-foreground text-xs">
          Showing demo fleet. Live CRUD requires Supabase.
        </p>
      ) : null}
    </div>
  );
}
