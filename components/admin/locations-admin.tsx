"use client";

import { useState } from "react";
import { createLocation, updateLocation } from "@/app/actions/locations";
import { LocationForm } from "@/components/admin/location-form";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <div className="flex flex-col gap-6">
      <OpsPageHeader
        eyebrow="Pickup hubs"
        title="Locations"
        actions={
          canWrite ? (
            <Button size="sm" onClick={() => setSheet({ type: "create" })}>
              Add location
            </Button>
          ) : undefined
        }
      />
      {locations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No locations yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add pickup hubs so customers can choose where to collect a car.
          </p>
          {canWrite ? (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setSheet({ type: "create" })}
            >
              Add location
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <CardTitle className="text-base">
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
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {loc.city}
                  {loc.region ? `, ${loc.region}` : ""} · {loc.slug}
                  {!loc.is_published ? " · unpublished" : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
      {!canWrite ? (
        <p className="text-muted-foreground text-xs">
          Demo locations are read-only. Connect Supabase to create and edit.
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
    </div>
  );
}
