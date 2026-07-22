import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export async function requireUser(nextPath?: string) {
  const session = await getSessionProfile();
  if (!session) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  return session;
}
