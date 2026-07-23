import { notFound } from "next/navigation";
import { updateLocation } from "@/app/actions/locations";
import { LocationForm } from "@/components/admin/location-form";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { getAdminLocationById } from "@/lib/admin/queries";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit location" };

export default async function EditLocationPage({ params }: Props) {
  const { id } = await params;
  const location = await getAdminLocationById(id);
  if (!location) notFound();

  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader eyebrow="Pickup hubs" title="Edit location" />
      <LocationForm
        location={location}
        action={async (fd) => {
          "use server";
          return updateLocation(id, fd);
        }}
      />
    </div>
  );
}
