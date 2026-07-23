"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function CarGallery({
  images,
  carName,
}: {
  images: GalleryImage[];
  carName: string;
}) {
  const list =
    images.length > 0
      ? images
      : [{ id: "fallback", url: "/window.svg", alt: carName }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-xl">
        <Image
          src={current.url}
          alt={current.alt || carName}
          fill
          priority
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 60vw"
        />
      </div>
      {list.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {list.map((img, i) => (
            <Button
              key={img.id}
              type="button"
              variant="outline"
              onClick={() => setActive(i)}
              className={cn(
                "bg-muted relative aspect-[4/3] h-auto overflow-hidden rounded-lg p-0",
                i === active
                  ? "ring-primary ring-2"
                  : "opacity-80 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
            >
              <Image
                src={img.url}
                alt={img.alt || `${carName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
