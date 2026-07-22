"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SITE_NAME } from "@/lib/constants";

type Item = { href: string; label: string };

export function MobileNav({
  items,
  signedIn,
}: {
  items: Item[];
  signedIn: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" className="md:hidden">
          <MenuIcon />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>{SITE_NAME}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cars"
            className="hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium"
          >
            Book a car
          </Link>
          <Link
            href={signedIn ? "/account/bookings" : "/login"}
            className="hover:bg-muted rounded-lg px-3 py-2 text-sm font-medium"
          >
            {signedIn ? "My bookings" : "Sign in"}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
