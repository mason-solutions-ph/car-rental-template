import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isDevAutoAdminEnabled,
  signInLocalDevAdmin,
} from "@/lib/auth/local-dev-admin";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every matched request.
 * Skips when env vars are missing so local setup still boots.
 * On local Supabase (dev), auto-signs in as the seed admin when there is no session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  // Always create a new client per request (do not put this in a global).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and getClaims().
  // Removing getClaims() can cause users to be randomly logged out with SSR.
  const { data: claimsData } = await supabase.auth.getClaims();

  // Local only: if nobody is signed in, become the seeded admin so /admin works
  // without a manual login. Opt out with DEV_AUTO_ADMIN=0.
  if (!claimsData?.claims && isDevAutoAdminEnabled()) {
    await signInLocalDevAdmin(supabase);
  }

  return supabaseResponse;
}
