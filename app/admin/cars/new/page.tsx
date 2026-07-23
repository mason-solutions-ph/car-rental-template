import { redirect } from "next/navigation";

export default function NewCarPage() {
  redirect("/admin/cars?new=1");
}
