import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditCarPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/cars?edit=${id}`);
}
