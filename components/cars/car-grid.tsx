import { CarCard } from "@/components/cars/car-card";
import type { CarWithImages } from "@/types";

export function CarGrid({
  cars,
  hrefQuery,
}: {
  cars: CarWithImages[];
  hrefQuery?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} hrefQuery={hrefQuery} />
      ))}
    </div>
  );
}
