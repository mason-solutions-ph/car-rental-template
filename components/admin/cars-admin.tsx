"use client";

import { useState } from "react";
import { createCar, updateCar } from "@/app/actions/cars";
import { CarForm } from "@/components/admin/car-form";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format/currency";
import type { Car } from "@/types";

const headClass =
  "font-mono text-[11px] uppercase tracking-wider text-muted-foreground";

type SheetMode = { type: "create" } | { type: "edit"; car: Car } | null;

function initialSheet(
  cars: Car[],
  canWrite: boolean,
  openNew?: boolean,
  editId?: string | null
): SheetMode {
  if (!canWrite) return null;
  if (openNew) return { type: "create" };
  if (editId) {
    const car = cars.find((c) => c.id === editId);
    if (car) return { type: "edit", car };
  }
  return null;
}

export function CarsAdmin({
  cars,
  canWrite,
  openNew = false,
  editId = null,
}: {
  cars: Car[];
  canWrite: boolean;
  openNew?: boolean;
  editId?: string | null;
}) {
  const [sheet, setSheet] = useState<SheetMode>(() =>
    initialSheet(cars, canWrite, openNew, editId)
  );

  function closeSheet() {
    setSheet(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader
        eyebrow="Fleet"
        title="Cars"
        actions={
          canWrite ? (
            <Button size="sm" onClick={() => setSheet({ type: "create" })}>
              Add car
            </Button>
          ) : undefined
        }
      />
      {cars.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No cars yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a car to publish it on the fleet page.
          </p>
          {canWrite ? (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setSheet({ type: "create" })}
            >
              Add car
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
                      {canWrite ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSheet({ type: "edit", car })}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {!canWrite ? (
        <p className="text-muted-foreground text-xs">
          Showing demo fleet. Live CRUD requires Supabase.
        </p>
      ) : null}

      <Sheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto sm:max-w-xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>
              {sheet?.type === "edit" ? "Edit car" : "Add car"}
            </SheetTitle>
            <SheetDescription>
              {sheet?.type === "edit"
                ? "Update fleet listing details. Changes apply after save."
                : "Create a car listing for the public fleet."}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {sheet?.type === "create" ? (
              <CarForm action={createCar} onSuccess={closeSheet} />
            ) : null}
            {sheet?.type === "edit" ? (
              <CarForm
                key={sheet.car.id}
                car={sheet.car}
                action={(fd) => updateCar(sheet.car.id, fd)}
                onSuccess={closeSheet}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
