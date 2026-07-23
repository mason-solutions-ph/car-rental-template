import { redirect } from "next/navigation";

export default function NewLocationPage() {
  redirect("/admin/locations?new=1");
}
