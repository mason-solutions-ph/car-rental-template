import { SITE_NAME } from "@/lib/constants";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {SITE_NAME} processes account, booking, and payment-related data to
        provide rentals. Payments are handled by PayMongo; we store payment
        references and status, not full card numbers. Replace this template
        notice with a full privacy policy before launch.
      </p>
    </div>
  );
}
