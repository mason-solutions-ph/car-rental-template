"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <h2 className="text-lg font-semibold">Admin error</h2>
      <p className="text-muted-foreground text-sm">
        Something went wrong in the admin area. Try again or return to the
        dashboard.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin">Dashboard</a>
        </Button>
      </div>
    </div>
  );
}
