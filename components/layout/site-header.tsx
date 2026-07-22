import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";

const nav = [
  { href: "/cars", label: "Fleet" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export async function SiteHeader() {
  const session = await getSessionProfile();

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            {SITE_NAME}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/cars">Book a car</Link>
          </Button>
          {session ? (
            <UserMenu
              email={session.user.email}
              name={session.profile?.full_name}
              isAdmin={session.profile?.role === "admin"}
            />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <MobileNav items={[...nav]} signedIn={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
