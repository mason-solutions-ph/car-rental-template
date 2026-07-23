import { CarForm } from "@/components/admin/car-form";
import { OpsPageHeader } from "@/components/admin/ops-chrome";
import { createCar } from "@/app/actions/cars";

export const metadata = { title: "New car" };

export default function NewCarPage() {
  return (
    <div className="flex flex-col gap-6">
      <OpsPageHeader eyebrow="Fleet" title="Add car" />
      <CarForm action={createCar} />
    </div>
  );
}
