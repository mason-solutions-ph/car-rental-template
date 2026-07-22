import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-sm font-semibold tracking-tight">
        {SITE_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
