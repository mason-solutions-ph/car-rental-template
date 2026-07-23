import { CarsAdmin } from "@/components/admin/cars-admin";
import { listAdminCars } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin cars" };

type Props = {
  searchParams: Promise<{ new?: string; edit?: string }>;
};

export default async function AdminCarsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cars = await listAdminCars();
  const canWrite = isSupabaseConfigured();

  return (
    <CarsAdmin
      cars={cars}
      canWrite={canWrite}
      openNew={sp.new === "1"}
      editId={sp.edit ?? null}
    />
  );
}
