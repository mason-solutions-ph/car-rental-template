import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default async function AdminCarsPage() {
  const cars = await listAdminCars();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Cars</h1>
        <Button asChild size="sm">
          <Link href="/admin/cars/new">Add car</Link>
        </Button>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id}>
                <TableCell className="font-medium">{car.name}</TableCell>
                <TableCell className="capitalize">{car.class}</TableCell>
                <TableCell>{formatMoney(car.daily_rate_cents)}</TableCell>
                <TableCell>
                  <Badge variant={car.is_published ? "default" : "secondary"}>
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
      </div>
      {!isSupabaseConfigured() ? (
        <p className="text-muted-foreground text-xs">
          Showing demo fleet. Live CRUD requires Supabase.
        </p>
      ) : null}
    </div>
  );
}
