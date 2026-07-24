import { Suspense } from "react";
import Link from "next/link";
import {
  AdminMobileNav,
  AdminSidebarNav,
  type AdminNavBadges,
} from "@/components/admin/admin-nav";
import { AdminShellHeader } from "@/components/admin/admin-shell-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminNavBadges } from "@/lib/admin/queries";
import { getFleetMode } from "@/lib/data/get-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE_NAME } from "@/lib/constants";

const NO_BADGES: AdminNavBadges = { unpaidPending: 0, openMessages: 0 };

/**
 * Streams the badge counts. The nav renders immediately with zero badges and
 * fills them in, so navigation is never gated on two count queries.
 */
async function SidebarNavWithBadges() {
  const badges = await getAdminNavBadges();
  return <AdminSidebarNav badges={badges} />;
}

async function MobileNavWithBadges({
  identity,
  email,
  canSignOut,
}: {
  identity: string;
  email: string | null;
  canSignOut: boolean;
}) {
  const badges = await getAdminNavBadges();
  return (
    <AdminMobileNav
      badges={badges}
      siteName={SITE_NAME}
      identity={identity}
      email={email}
      canSignOut={canSignOut}
    />
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let displayName: string | null = null;
  let email: string | null = null;

  // The auth gate must resolve before anything renders. Moving it below a
  // Suspense boundary would commit a 200 and leak a shell to an unauthorized
  // viewer before the redirect could fire.
  const configured = isSupabaseConfigured();
  if (configured) {
    const session = await requireAdmin();
    displayName = session.profile?.full_name ?? null;
    email = session.user.email ?? null;
  }

  const identity = displayName || email || "Admin";
  const mode = getFleetMode();

  const mobileNav = (
    <Suspense
      fallback={
        <AdminMobileNav
          badges={NO_BADGES}
          siteName={SITE_NAME}
          identity={identity}
          email={email}
          canSignOut={configured}
        />
      }
    >
      <MobileNavWithBadges
        identity={identity}
        email={email}
        canSignOut={configured}
      />
    </Suspense>
  );

  return (
    <div className="flex min-h-full flex-1">
      <aside className="bg-sidebar border-sidebar-border hidden w-56 shrink-0 border-r md:flex md:flex-col">
        <div className="flex h-12 items-center border-b px-4">
          <Link
            href="/"
            className="text-ui font-mono font-semibold tracking-[0.08em] uppercase"
          >
            {SITE_NAME}
          </Link>
        </div>
        <div className="flex-1 p-2">
          <Suspense fallback={<AdminSidebarNav badges={NO_BADGES} />}>
            <SidebarNavWithBadges />
          </Suspense>
        </div>
        <div className="border-t p-2">
          <div className="px-2 pb-2">
            <p className="text-ui truncate font-medium">{identity}</p>
            {email && displayName ? (
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
            {configured ? (
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminShellHeader mode={mode} mobileNav={mobileNav} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
