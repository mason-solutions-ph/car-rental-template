import { createLocation } from "@/app/actions/locations";
import { LocationForm } from "@/components/admin/location-form";

export const metadata = { title: "New location" };

export default function NewLocationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add location</h1>
      <LocationForm action={createLocation} />
    </div>
  );
}
