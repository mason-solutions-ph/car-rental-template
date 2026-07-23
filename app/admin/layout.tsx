import Link from "next/link";
import {
  AdminMobileNav,
  AdminSidebarNav,
  type AdminNavLink,
} from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminNavBadges } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE_NAME } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let displayName: string | null = null;
  let email: string | null = null;
  let badges = { unpaidPending: 0, openMessages: 0, demo: true };

  if (isSupabaseConfigured()) {
    const session = await requireAdmin();
    displayName = session.profile?.full_name ?? null;
    email = session.user.email ?? null;
    badges = await getAdminNavBadges();
  }

  const links: AdminNavLink[] = [
    { href: "/admin", label: "Dashboard" },
    {
      href: "/admin/bookings",
      label: "Bookings",
      badge: badges.unpaidPending,
    },
    { href: "/admin/cars", label: "Cars" },
    { href: "/admin/locations", label: "Locations" },
    {
      href: "/admin/messages",
      label: "Messages",
      badge: badges.openMessages,
    },
  ];

  const identity = displayName || email || "Admin";

  return (
    <div className="flex min-h-full flex-1">
      <aside className="bg-muted/40 hidden w-56 shrink-0 border-r md:flex md:flex-col">
        <div className="border-b p-4">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <p className="text-muted-foreground text-xs">Admin</p>
        </div>
        <div className="flex-1 p-3">
          <AdminSidebarNav links={links} />
        </div>
        <div className="border-t p-3">
          <p className="truncate text-sm font-medium">{identity}</p>
          {email && displayName ? (
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          ) : null}
          <div className="mt-3 flex flex-col gap-1">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href="/">View site</Link>
            </Button>
            {isSupabaseConfigured() ? (
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  Sign out
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{SITE_NAME}</p>
            <p className="text-muted-foreground truncate text-xs">{identity}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Site</Link>
            </Button>
            <AdminMobileNav links={links} siteName={SITE_NAME} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
