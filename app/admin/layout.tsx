import { cookies } from "next/headers";
import { Suspense } from "react";

import { AdminShellHeader } from "@/components/admin/admin-shell-header";
import { AppSidebar } from "@/components/admin/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAdminNavBadges } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getFleetMode } from "@/lib/data/get-fleet-repo";
import { isSupabaseConfigured } from "@/lib/env";

async function SidebarWithBadges({
  user,
  canSignOut,
}: {
  user: { name: string; email: string | null };
  canSignOut: boolean;
}) {
  const badges = await getAdminNavBadges();
  return (
    <AppSidebar
      user={user}
      canSignOut={canSignOut}
      badges={{ unpaidPending: badges.unpaidPending }}
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

  // Auth gate must resolve before shell renders.
  const configured = isSupabaseConfigured();
  if (configured) {
    const session = await requireAdmin();
    displayName = session.profile?.full_name ?? null;
    email = session.user.email ?? null;
  }

  const user = {
    name: displayName || email || "Admin",
    email,
  };
  const mode = getFleetMode();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "16rem",
        } as React.CSSProperties
      }
    >
      <Suspense
        fallback={
          <AppSidebar user={user} canSignOut={configured} badges={{}} />
        }
      >
        <SidebarWithBadges user={user} canSignOut={configured} />
      </Suspense>

      <SidebarInset className="min-w-0 overflow-x-clip">
        <AdminShellHeader mode={mode} />
        <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
