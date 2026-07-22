import { ContactForm } from "@/components/contact/contact-form";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="text-muted-foreground text-sm">
          Questions about fleet, corporate rates, or refunds? Send a message.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
