import { ArrowUpRight } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OverviewCategoryShare, OverviewTopCar } from "@/lib/admin/overview";

export function TopProducts({
  categories,
  products,
  headline,
}: {
  categories: OverviewCategoryShare[];
  products: OverviewTopCar[];
  headline: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Top cars</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {headline}
        </CardDescription>
        <CardAction>
          <a href="/admin/cars" aria-label="View fleet">
            <ArrowUpRight className="size-4" />
          </a>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div
            aria-label="Sales by class"
            className="flex h-2 gap-1 overflow-hidden bg-muted"
            role="img"
          >
            {categories.length === 0 ? (
              <div className="h-full w-full rounded-md bg-muted-foreground/20" />
            ) : (
              categories.map((category) => (
                <div
                  aria-hidden="true"
                  key={category.name}
                  className="rounded-md"
                  style={{
                    backgroundColor: category.color,
                    width: `${Math.max(category.share, 2)}%`,
                  }}
                />
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <div className="flex items-center gap-1" key={category.name}>
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-muted-foreground text-xs">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
          <div className="text-muted-foreground text-xs">Car</div>
          <div className="text-muted-foreground text-xs">Share</div>
          <div className="text-muted-foreground text-xs">Revenue</div>

          {products.length === 0 ? (
            <div className="text-muted-foreground col-span-3 text-sm">
              No paid bookings in this period.
            </div>
          ) : (
            products.map((product) => (
              <div className="contents text-sm" key={product.name}>
                <div className="min-w-0">
                  <div className="truncate font-medium">{product.name}</div>
                  <div className="text-muted-foreground text-xs">{product.category}</div>
                </div>
                <div className="self-center text-muted-foreground tabular-nums">
                  {product.share}
                </div>
                <div className="self-center font-medium tabular-nums">{product.sales}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
