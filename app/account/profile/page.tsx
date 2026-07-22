import { ProfileForm } from "@/components/account/profile-form";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to edit your profile.
      </p>
    );
  }

  const session = await getSessionProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <ProfileForm
        defaults={{
          fullName: session?.profile?.full_name,
          phone: session?.profile?.phone,
          licenseNumber: session?.profile?.license_number,
        }}
      />
    </div>
  );
}
