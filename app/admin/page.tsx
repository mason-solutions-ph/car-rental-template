import Link from "next/link";
import { ExpireHoldsButton } from "@/components/admin/expire-holds-button";
import { UnpaidBookingsQueue } from "@/components/admin/unpaid-bookings-queue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAdminDashboardStats,
  listAdminUnpaidPending,
} from "@/lib/admin/queries";
import { CHECKOUT_HOLD_MINUTES } from "@/lib/constants";
import { formatMoney } from "@/lib/format/currency";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const unpaidQueue =
    isSupabaseConfigured() && !stats.demo
      ? await listAdminUnpaidPending(25)
      : [];

  const cards = [
    { label: "Published cars", value: String(stats.publishedCars) },
    { label: "Unpaid pending", value: String(stats.unpaidPending) },
    { label: "Paid this week", value: String(stats.paidThisWeek) },
    { label: "Gross paid", value: formatMoney(stats.grossPaidCents) },
  ];

  return (
    <div className="flex flex-col gap-8">
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

      {!stats.demo ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Unpaid queue
              </h2>
              <p className="text-muted-foreground text-sm">
                Pending checkouts still unpaid. Hold is{" "}
                {CHECKOUT_HOLD_MINUTES} minutes. Reconcile when a webhook lags.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ExpireHoldsButton />
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin/bookings">All bookings</Link>
              </Button>
            </div>
          </div>
          <UnpaidBookingsQueue rows={unpaidQueue} />
        </section>
      ) : null}
    </div>
  );
}
