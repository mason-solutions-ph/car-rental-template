import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  searchParams: Promise<{ booking_id?: string }>;
};

export const metadata = { title: "Payment cancelled" };

export default async function PaymentCancelPage({ searchParams }: Props) {
  const { booking_id } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Checkout cancelled</CardTitle>
          <CardDescription>
            No payment was completed. Your unpaid booking is held briefly — you
            can pay again from your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {booking_id ? (
            <Button asChild>
              <Link href={`/account/bookings/${booking_id}`}>
                Resume booking
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/cars">Back to fleet</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
