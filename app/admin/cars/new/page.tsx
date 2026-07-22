import { CarForm } from "@/components/admin/car-form";
import { createCar } from "@/app/actions/cars";

export const metadata = { title: "New car" };

export default function NewCarPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add car</h1>
      <CarForm action={createCar} />
    </div>
  );
}
