import { Users } from "@/components/admin/users/users";
import { listAdminUsers } from "@/lib/admin/queries";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const users = await listAdminUsers();
  return <Users users={users} />;
}
