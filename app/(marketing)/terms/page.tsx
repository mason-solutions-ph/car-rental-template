import { SITE_NAME } from "@/lib/constants";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of rental</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        This is template legal copy for {SITE_NAME}. Replace with counsel-reviewed
        terms before production. Renters must hold a valid license, pay the full
        rental total via PayMongo at booking (unless otherwise agreed), and return
        the vehicle in agreed condition by the drop-off time. Cancellations and
        refunds follow the policy published on the FAQ and booking screens.
      </p>
    </div>
  );
}
