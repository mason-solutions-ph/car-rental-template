import { format } from "date-fns";
import { Suspense } from "react";

import { Inventory } from "@/components/admin/overview/inventory";
import { KpiStrip } from "@/components/admin/overview/kpi-strip";
import { OverviewToolbar } from "@/components/admin/overview/overview-toolbar";
import { RecentBookings } from "@/components/admin/overview/recent-bookings";
import { BookingActivity } from "@/components/admin/overview/booking-activity";
import { TopProducts } from "@/components/admin/overview/top-products";
import { TrafficSources } from "@/components/admin/overview/traffic-sources";
import {
  NeedsActionSection,
  UpcomingPickupsSection,
} from "@/components/admin/ops-home-sections";
import { OpsEyebrow } from "@/components/admin/ops-chrome";
import { OpsPanel } from "@/components/admin/ops-panel";
import { OpsTableSkeleton } from "@/components/admin/ops-skeletons";
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

      {data.demo ? (
        <OpsPanel tone="dashed" className="flex flex-col gap-1 p-6">
          <OpsEyebrow>Demo mode</OpsEyebrow>
          <p className="text-ui font-medium">Fleet metrics use seed cars</p>
          <p className="text-muted-foreground max-w-[68ch] text-sm">
            Revenue, holds, and pickups need a connected Supabase project with
            migrations. Bookings pages stay available for when you go live.
          </p>
        </OpsPanel>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <KpiStrip data={data} />
        <div className="xl:col-span-5">
          <BookingActivity series={data.activitySeries} total={data.activityTotal} />
        </div>
        <div className="xl:col-span-7">
          <TrafficSources shares={data.statusShares} total={data.statusTotal} />
        </div>
        <div className="xl:col-span-6">
          <TopProducts
            categories={data.categories}
            products={data.topCars}
            headline={topShare}
          />
        </div>
        <div className="xl:col-span-6">
          <Inventory fleet={data.fleet} />
        </div>

        <div className="xl:col-span-12">
          <Suspense fallback={<OpsTableSkeleton columns={7} rows={4} />}>
            <NeedsActionSection />
          </Suspense>
        </div>

        <div className="xl:col-span-12">
          <Suspense fallback={<OpsTableSkeleton columns={5} rows={5} />}>
            <UpcomingPickupsSection />
          </Suspense>
        </div>

        <div className="xl:col-span-12">
          <RecentBookings rows={data.recentBookings} />
        </div>
      </div>
    </div>
  );
}
