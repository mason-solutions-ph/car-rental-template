"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type AdminNavLink = {
  href: string;
  label: string;
  badge?: number;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  links,
  pathname,
  onNavigate,
  className,
}: {
  links: AdminNavLink[];
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <span>{l.label}</span>
            {l.badge != null && l.badge > 0 ? (
              <Badge
                variant={active ? "default" : "secondary"}
                className="h-5 min-w-5 justify-center px-1.5 tabular-nums"
              >
                {l.badge > 99 ? "99+" : l.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebarNav({ links }: { links: AdminNavLink[] }) {
  const pathname = usePathname();
  return <NavLinks links={links} pathname={pathname} />;
}

export function AdminMobileNav({
  links,
  siteName,
}: {
  links: AdminNavLink[];
  siteName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <MenuIcon className="size-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">{siteName} Admin</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <NavLinks
            links={links}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
