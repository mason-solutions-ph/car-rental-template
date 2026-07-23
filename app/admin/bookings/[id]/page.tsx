import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/bookings?booking=${id}`);
}
