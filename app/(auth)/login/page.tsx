import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Access your bookings and continue checkout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={sp.next} />
      </CardContent>
    </Card>
  );
}
