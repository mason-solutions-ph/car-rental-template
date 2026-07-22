import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/format/currency";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Published cars", value: String(stats.publishedCars) },
    { label: "Unpaid pending", value: String(stats.unpaidPending) },
    { label: "Paid this week", value: String(stats.paidThisWeek) },
    { label: "Gross paid", value: formatMoney(stats.grossPaidCents) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {stats.demo
            ? "Demo stats from local fleet data. Connect Supabase for live bookings."
            : "Operational overview"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
