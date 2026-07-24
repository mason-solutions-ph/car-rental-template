import { format } from "date-fns";
import { Suspense } from "react";

import { CustomerReviews } from "@/components/admin/ecommerce/customer-reviews";
import { Inventory } from "@/components/admin/ecommerce/inventory";
import { KpiStrip } from "@/components/admin/ecommerce/kpi-strip";
import { OverviewToolbar } from "@/components/admin/ecommerce/overview-toolbar";
import { RecentOrders } from "@/components/admin/ecommerce/recent-orders";
import { StoreTraffic } from "@/components/admin/ecommerce/store-traffic";
import { TopProducts } from "@/components/admin/ecommerce/top-products";
import { TrafficSources } from "@/components/admin/ecommerce/traffic-sources";
import { getAdminOverview } from "@/lib/admin/overview";
import { parseOverviewPeriod } from "@/lib/admin/overview-period";

export const metadata = { title: "Admin" };

type PageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const period = parseOverviewPeriod(sp.period);
  const data = await getAdminOverview(period);
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");

  const topShare =
    data.topCars.length > 0 && data.topCars[0].share !== "—"
      ? `${data.topCars
          .map((c) => Number.parseInt(c.share, 10) || 0)
          .reduce((a, b) => a + b, 0)}% of paid revenue`
      : data.demo
        ? "Demo fleet"
        : "Top earners";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Fleet overview</h1>
          <p className="text-muted-foreground text-sm">
            {formattedDate}
            <span className="text-muted-foreground/80"> · {data.periodLabel}</span>
            {data.demo ? (
              <span className="text-muted-foreground/80"> · Demo mode</span>
            ) : null}
          </p>
        </div>

        <Suspense fallback={null}>
          <OverviewToolbar period={period} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip data={data} />
        <div className="xl:col-span-5">
          <StoreTraffic series={data.activitySeries} total={data.activityTotal} />
        </div>
        <div className="xl:col-span-7">
          <TrafficSources shares={data.statusShares} total={data.statusTotal} />
        </div>
        <div className="xl:col-span-4">
          <TopProducts
            categories={data.categories}
            products={data.topCars}
            headline={topShare}
          />
        </div>
        <div className="xl:col-span-4">
          <Inventory fleet={data.fleet} />
        </div>
        <div className="xl:col-span-4">
          <CustomerReviews messages={data.messages} />
        </div>
        <div className="xl:col-span-12">
          <RecentOrders rows={data.recentBookings} />
        </div>
      </div>
    </div>
  );
}
