import { createLocation } from "@/app/actions/locations";
import { LocationForm } from "@/components/admin/location-form";
import { OpsPageHeader } from "@/components/admin/ops-chrome";

export const metadata = { title: "New location" };

export default function NewLocationPage() {
  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader eyebrow="Pickup hubs" title="Add location" />
      <LocationForm action={createLocation} />
    </div>
  );
}
