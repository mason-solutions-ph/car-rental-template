import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format/currency";
import type { CarWithImages } from "@/types";

export function CarCard({
  car,
  hrefQuery,
}: {
  car: CarWithImages;
  hrefQuery?: string;
}) {
  const href = hrefQuery ? `/cars/${car.slug}?${hrefQuery}` : `/cars/${car.slug}`;
  const img =
    car.hero_image_url || car.car_images?.[0]?.url || "/window.svg";

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="bg-muted relative aspect-[16/10] overflow-hidden">
          <Image
            src={img}
            alt={car.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {car.class}
            </Badge>
            <span className="text-muted-foreground text-xs">{car.year}</span>
          </div>
          <CardTitle className="text-base">{car.name}</CardTitle>
          <CardDescription>
            {car.seats} seats · {car.transmission} · {car.fuel_type}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold">
            {formatMoney(car.daily_rate_cents)}
            <span className="text-muted-foreground font-normal"> / day</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
