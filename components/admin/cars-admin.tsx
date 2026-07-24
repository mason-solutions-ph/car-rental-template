"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CarIcon, SearchIcon } from "lucide-react";
import { createCar, updateCar } from "@/app/actions/cars";
import { CarForm } from "@/components/admin/car-form";
import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsPanel } from "@/components/admin/ops-panel";
import {
  OpsSectionHeader,
  opsTableHeadClass,
} from "@/components/admin/ops-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
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

const CAR_FORM_ID = "admin-car-form";

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

function matchesQuery(car: Car, q: string): boolean {
  if (!q) return true;
  const hay = [
    car.name,
    car.make,
    car.model,
    car.class,
    car.slug,
    car.status,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
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
  const [query, setQuery] = useState("");
  const [formPending, setFormPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) => matchesQuery(c, q));
  }, [cars, query]);

  function closeSheet() {
    setSheet(null);
    setFormPending(false);
  }

  function openEdit(car: Car) {
    if (!canWrite) return;
    setSheet({ type: "edit", car });
  }

  return (
    <section aria-labelledby="ops-fleet" className="flex flex-col gap-3">
      <OpsSectionHeader
        id="ops-fleet"
        title="Fleet"
        count={cars.length}
        description={
          canWrite ? undefined : "Showing demo fleet. Live CRUD requires Supabase."
        }
        actions={
          canWrite ? (
            <Button size="sm" onClick={() => setSheet({ type: "create" })}>
              Add car
            </Button>
          ) : undefined
        }
      />

      {cars.length > 0 ? (
        <div className="relative max-w-sm">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, class, make…"
            className="pl-8"
            aria-label="Search cars"
          />
        </div>
      ) : null}

      {cars.length === 0 ? (
        <OpsEmptyState
          title="No cars yet"
          description="Add a car to publish it on the fleet page."
          action={
            canWrite ? (
              <Button size="sm" onClick={() => setSheet({ type: "create" })}>
                Add car
              </Button>
            ) : null
          }
        />
      ) : (
        <OpsPanel>
          <Table className="text-ui">
              <TableHeader>
                <TableRow>
                  <TableHead className={opsTableHeadClass}>Car</TableHead>
                  <TableHead className={opsTableHeadClass}>Class</TableHead>
                  <TableHead className={opsTableHeadClass}>Rate</TableHead>
                  <TableHead className={opsTableHeadClass}>Published</TableHead>
                  <TableHead className={opsTableHeadClass}>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No cars match “{query.trim()}”.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((car) => (
                    <TableRow
                      key={car.id}
                      className={canWrite ? "cursor-pointer" : undefined}
                      onClick={() => openEdit(car)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
                            {car.hero_image_url ? (
                              <Image
                                src={car.hero_image_url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="text-muted-foreground flex size-full items-center justify-center">
                                <CarIcon className="size-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {car.name}
                            </div>
                            <div className="text-muted-foreground text-label truncate font-mono">
                              {car.make} {car.model}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{car.class}</TableCell>
                      <TableCell className="font-mono tabular-nums">
                        {formatMoney(car.daily_rate_cents)}
                      </TableCell>
                      <TableCell>
                        {car.is_published ? (
                          <span className="text-muted-foreground text-label font-mono tracking-[0.14em] uppercase">
                            Published
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-label font-mono tracking-[0.14em] uppercase"
                          >
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{car.status}</TableCell>
                      <TableCell>
                        {canWrite ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(car);
                            }}
                          >
                            Edit
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
          </Table>
        </OpsPanel>
      )}

      <Sheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b">
            <SheetTitle>
              {sheet?.type === "edit" ? "Edit car" : "Add car"}
            </SheetTitle>
            <SheetDescription>
              {sheet?.type === "edit"
                ? "Update fleet listing details. Changes apply after save."
                : "Create a car listing for the public fleet."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {sheet?.type === "create" ? (
              <CarForm
                formId={CAR_FORM_ID}
                hideSubmit
                action={createCar}
                onSuccess={closeSheet}
                onPendingChange={setFormPending}
              />
            ) : null}
            {sheet?.type === "edit" ? (
              <CarForm
                key={sheet.car.id}
                formId={CAR_FORM_ID}
                hideSubmit
                car={sheet.car}
                action={(fd) => updateCar(sheet.car.id, fd)}
                onSuccess={closeSheet}
                onPendingChange={setFormPending}
              />
            ) : null}
          </div>
          <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={formPending}
              onClick={closeSheet}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form={CAR_FORM_ID}
              size="sm"
              disabled={formPending || sheet === null}
            >
              {formPending ? <Spinner /> : null}
              Save car
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
