"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { OpsClock } from "@/components/admin/ops-clock";
import { OpsModeIndicator, OpsRule } from "@/components/admin/ops-chrome";
import { OpsThemeToggle } from "@/components/admin/ops-theme-toggle";
import { buildAdminBreadcrumbs } from "@/lib/admin/breadcrumbs";
import type { FleetMode } from "@/lib/data/fleet-repo";

/**
 * Sticky content header. Carries page identity (breadcrumb trail ending in the
 * h1) on the left and global console chrome on the right.
 *
 * This replaces the per-page title block: the trail already names the page, so
 * repeating it in the body would cost a whole row of vertical space to say the
 * same thing twice. Page-level actions live on the first section header
 * instead, next to the content they act on.
 */
export function AdminShellHeader({
  mode,
  mobileNav,
}: {
  mode: FleetMode;
  /** Rendered below the md breakpoint, where the sidebar is hidden. */
  mobileNav?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { ancestors, title } = buildAdminBreadcrumbs(pathname);

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {mobileNav ? <div className="md:hidden">{mobileNav}</div> : null}
        {ancestors.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="hidden items-center gap-1.5 sm:flex"
          >
            {ancestors.map((crumb) => (
              <Fragment key={crumb.href}>
                <Link
                  href={crumb.href}
                  className="text-ui text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
                <ChevronRightIcon
                  aria-hidden
                  strokeWidth={1.5}
                  className="text-muted-foreground/60 size-3.5 shrink-0"
                />
              </Fragment>
            ))}
          </nav>
        ) : null}
        <h1 className="text-ui truncate font-semibold">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <OpsModeIndicator mode={mode} className="hidden sm:flex" />
        <OpsRule className="hidden sm:inline-block" />
        <OpsClock className="hidden md:flex" />
        <OpsThemeToggle />
      </div>
    </header>
  );
}
