import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireUser } from "@/lib/auth/require-user";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    await requireUser("/account/bookings");
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/account/bookings" className="hover:underline">
            Bookings
          </Link>
          <Link href="/account/profile" className="hover:underline">
            Profile
          </Link>
        </nav>
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
