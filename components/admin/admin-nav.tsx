"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheckIcon,
  CarIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MailIcon,
  MapPinIcon,
  MenuIcon,
  type LucideIcon,
} from "lucide-react";
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

/** Live counts the server passes down. The nav structure itself is static. */
export type AdminNavBadges = {
  unpaidPending: number;
  openMessages: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: keyof AdminNavBadges;
  badgeTone?: "default" | "attention";
};

/**
 * Defined here rather than passed from the layout because icons are component
 * references, which are not serializable across the server/client boundary.
 * Only the badge counts cross it.
 */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        href: "/admin/bookings",
        label: "Bookings",
        icon: CalendarCheckIcon,
        badgeKey: "unpaidPending",
        badgeTone: "attention",
      },
      { href: "/admin/cars", label: "Cars", icon: CarIcon },
      { href: "/admin/locations", label: "Locations", icon: MapPinIcon },
      { href: "/admin/invoice", label: "Invoice", icon: FileTextIcon },
      {
        href: "/admin/messages",
        label: "Messages",
        icon: MailIcon,
        badgeKey: "openMessages",
      },
    ],
  },
];

const groupLabelClass =
  "text-label text-muted-foreground/70 px-2 pb-1 font-mono font-medium tracking-[0.14em] uppercase";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGroups({
  badges,
  pathname,
  onNavigate,
}: {
  badges: AdminNavBadges;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={groupLabelClass}>{group.label}</p>
          <nav className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-ui flex h-8 items-center gap-2 rounded-sm px-2 transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden strokeWidth={1.5} className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {badge != null && badge > 0 ? (
                    <Badge
                      variant={item.badgeTone === "attention" ? "outline" : "secondary"}
                      className={cn(
                        "ml-auto h-4.5 min-w-4.5 justify-center px-1 font-mono text-[10px] tabular-nums",
                        item.badgeTone === "attention" &&
                          "border-transparent bg-attention/15 text-attention"
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebarNav({ badges }: { badges: AdminNavBadges }) {
  const pathname = usePathname();
  return <NavGroups badges={badges} pathname={pathname} />;
}

export function AdminMobileNav({
  badges,
  siteName,
  identity,
  email,
  canSignOut,
}: {
  badges: AdminNavBadges;
  siteName: string;
  identity: string;
  email: string | null;
  canSignOut: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open navigation"
        >
          <MenuIcon className="size-4" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col">
        <SheetHeader>
          <SheetTitle className="text-left text-base">
            {siteName} Admin
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2">
          <NavGroups
            badges={badges}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </div>
        {/* The sidebar is hidden below md, so identity and session actions
            live here rather than being unreachable on small screens. */}
        <div className="border-t p-2">
          <div className="px-2 pb-2">
            <p className="text-ui truncate font-medium">{identity}</p>
            {email ? (
              <p className="text-muted-foreground truncate font-mono text-xs">
                {email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-ui h-8 justify-start font-normal"
            >
              <Link href="/">View site</Link>
            </Button>
            {canSignOut ? (
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-ui text-destructive hover:text-destructive h-8 w-full justify-start font-normal"
                >
                  Sign out
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
