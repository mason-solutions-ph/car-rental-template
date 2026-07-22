import { SITE_NAME } from "@/lib/constants";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">About {SITE_NAME}</h1>
      <p className="text-muted-foreground leading-relaxed">
        {SITE_NAME} is a premium car rental experience for the Philippines —
        curated vehicles, transparent PHP pricing, and secure checkout powered
        by PayMongo. Whether you need an airport run or a weekend sports car,
        we keep the flow simple: search, book, pay, drive.
      </p>
    </div>
  );
}
