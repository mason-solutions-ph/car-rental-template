import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export async function requireAdmin() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/admin");
  if (session.profile?.role !== "admin") redirect("/");
  return session;
}
