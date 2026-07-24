"use client";

import { useState } from "react";
import { createLocation, updateLocation } from "@/app/actions/locations";
import { LocationForm } from "@/components/admin/location-form";
import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import {
  OpsSectionHeader,
  opsTableHeadClass,
} from "@/components/admin/ops-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { Location } from "@/types";

type SheetMode =
  | { type: "create" }
  | { type: "edit"; location: Location }
  | null;

function initialSheet(
  locations: Location[],
  canWrite: boolean,
  openNew?: boolean,
  editId?: string | null
): SheetMode {
  if (!canWrite) return null;
  if (openNew) return { type: "create" };
  if (editId) {
    const location = locations.find((l) => l.id === editId);
    if (location) return { type: "edit", location };
  }
  return null;
}

export function LocationsAdmin({
  locations,
  canWrite,
  openNew = false,
  editId = null,
}: {
  locations: Location[];
  canWrite: boolean;
  openNew?: boolean;
  editId?: string | null;
}) {
  const [sheet, setSheet] = useState<SheetMode>(() =>
    initialSheet(locations, canWrite, openNew, editId)
  );

  function closeSheet() {
    setSheet(null);
  }

  return (
    <section aria-labelledby="ops-locations" className="flex flex-col gap-3">
      <OpsSectionHeader
        id="ops-locations"
        title="Pickup hubs"
        count={locations.length}
        description={
          canWrite
            ? undefined
            : "Demo locations are read-only. Connect Supabase to create and edit."
        }
        actions={
          canWrite ? (
            <Button size="sm" onClick={() => setSheet({ type: "create" })}>
              Add location
            </Button>
          ) : undefined
        }
      />
      {locations.length === 0 ? (
        <OpsEmptyState
          title="No locations yet"
          description="Add pickup hubs so customers can choose where to collect a car."
          action={
            canWrite ? (
              <Button size="sm" onClick={() => setSheet({ type: "create" })}>
                Add location
              </Button>
            ) : null
          }
        />
      ) : (
        <OpsPanel>
          <Table className="text-ui">
            <TableHeader>
              <TableRow>
                <TableHead className={opsTableHeadClass}>Name</TableHead>
                <TableHead className={opsTableHeadClass}>City</TableHead>
                <TableHead className={opsTableHeadClass}>Slug</TableHead>
                <TableHead className={opsTableHeadClass}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => setSheet({ type: "edit", location: loc })}
                        className="text-left underline-offset-4 hover:underline"
                      >
                        {loc.name}
                      </button>
                    ) : (
                      loc.name
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {loc.city}
                    {loc.region ? `, ${loc.region}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {loc.slug || <OpsEmptyValue label="No slug" />}
                  </TableCell>
                  <TableCell>
                    {loc.is_published ? (
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
                </TableRow>
              ))}
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
          className="w-full gap-0 overflow-y-auto sm:max-w-xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>
              {sheet?.type === "edit" ? "Edit location" : "Add location"}
            </SheetTitle>
            <SheetDescription>
              {sheet?.type === "edit"
                ? "Update pickup hub details."
                : "Create a pickup hub for customers."}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {sheet?.type === "create" ? (
              <LocationForm action={createLocation} onSuccess={closeSheet} />
            ) : null}
            {sheet?.type === "edit" ? (
              <LocationForm
                key={sheet.location.id}
                location={sheet.location}
                action={(fd) => updateLocation(sheet.location.id, fd)}
                onSuccess={closeSheet}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
