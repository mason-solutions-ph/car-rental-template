import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE_NAME } from "@/lib/constants";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/cars", label: "Cars" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/messages", label: "Messages" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    await requireAdmin();
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="bg-muted/40 hidden w-56 shrink-0 border-r md:flex md:flex-col">
        <div className="border-b p-4">
          <Link href="/" className="text-sm font-semibold">
            {SITE_NAME}
          </Link>
          <p className="text-muted-foreground text-xs">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:bg-muted rounded-md px-3 py-2 text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm">
              {l.label}
            </Link>
          ))}
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
