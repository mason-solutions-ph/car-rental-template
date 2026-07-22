export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key && !url.includes("your-project") && url.startsWith("http"));
}

export function isPaymongoConfigured(): boolean {
  const key = process.env.PAYMONGO_SECRET_KEY;
  return Boolean(key && key.startsWith("sk_"));
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
