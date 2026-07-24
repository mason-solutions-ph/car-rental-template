import { createAdminClient } from "@/lib/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Default local-only staff account (seed + auto-login). */
export const LOCAL_DEV_ADMIN_EMAIL = "admin@localhost.dev";
export const LOCAL_DEV_ADMIN_PASSWORD = "adminadmin";
export const LOCAL_DEV_ADMIN_NAME = "Local Admin";

export function isLocalSupabaseUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Auto-login as the local admin when:
 * - not production
 * - Supabase URL points at localhost / 127.0.0.1
 * - DEV_AUTO_ADMIN is not "0"
 */
export function isDevAutoAdminEnabled(env?: {
  nodeEnv?: string;
  supabaseUrl?: string;
  devAutoAdmin?: string;
}): boolean {
  const nodeEnv = env?.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv === "production") return false;

  const flag = env?.devAutoAdmin ?? process.env.DEV_AUTO_ADMIN;
  if (flag === "0" || flag === "false") return false;

  const url = env?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  return isLocalSupabaseUrl(url);
}

export function getLocalDevAdminCredentials() {
  return {
    email: process.env.DEV_ADMIN_EMAIL ?? LOCAL_DEV_ADMIN_EMAIL,
    password: process.env.DEV_ADMIN_PASSWORD ?? LOCAL_DEV_ADMIN_PASSWORD,
    fullName: process.env.DEV_ADMIN_NAME ?? LOCAL_DEV_ADMIN_NAME,
  };
}

let ensureOnce: Promise<void> | null = null;

/** Create/update the local admin user + promote profiles.role (service role). */
export async function ensureLocalDevAdminExists(): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  if (!ensureOnce) {
    ensureOnce = ensureLocalDevAdminExistsImpl().catch((err) => {
      ensureOnce = null;
      throw err;
    });
  }
  await ensureOnce;
}

async function ensureLocalDevAdminExistsImpl(): Promise<void> {
  const { email, password, fullName } = getLocalDevAdminCredentials();
  const admin = createAdminClient();

  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  if (list.error) throw list.error;

  let user = list.data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (created.error) throw created.error;
    user = created.data.user;
  } else {
    const upd = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (upd.error) throw upd.error;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    role: "admin",
    full_name: fullName,
  });
  if (profileError) throw profileError;
}

/**
 * Sign the request's Supabase client in as the local admin.
 * Returns true when a session was established.
 */
export async function signInLocalDevAdmin(
  supabase: SupabaseClient
): Promise<boolean> {
  if (!isDevAutoAdminEnabled()) return false;

  try {
    await ensureLocalDevAdminExists();
    const { email, password } = getLocalDevAdminCredentials();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return !error;
  } catch {
    return false;
  }
}
