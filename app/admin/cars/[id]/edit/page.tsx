import { notFound } from "next/navigation";
import { CarForm } from "@/components/admin/car-form";
import { updateCar } from "@/app/actions/cars";
import { getAdminCarById } from "@/lib/admin/queries";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit car" };

export default async function EditCarPage({ params }: Props) {
  const { id } = await params;
  const car = await getAdminCarById(id);
  if (!car) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit car</h1>
      <CarForm
        car={car}
        action={async (fd) => {
          "use server";
          return updateCar(id, fd);
        }}
      />
    </div>
  );
}
