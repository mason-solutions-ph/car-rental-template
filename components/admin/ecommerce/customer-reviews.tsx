import { ArrowLeft, ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OverviewMessage } from "@/lib/admin/overview";
import { formatDateTime } from "@/lib/format/date";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CustomerReviews({ messages }: { messages: OverviewMessage[] }) {
  const featured = messages[0];
  const avatars = messages.slice(0, 4);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Inbox</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {messages.length === 0
            ? "No messages"
            : `${messages.length} recent message${messages.length === 1 ? "" : "s"}`}
        </CardDescription>
        <CardAction>
          <Link href="/admin/messages" aria-label="View all messages">
            <ArrowUpRight className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          {featured ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5 text-foreground">
                  <Mail className="size-3.5" />
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatDateTime(featured.createdAt)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{featured.name}</div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {featured.subject ?? "No subject"}
                  </p>
                  <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                    {featured.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <Button aria-label="Previous message" size="icon-xs" variant="outline" disabled>
                  <ArrowLeft />
                </Button>
                <Button aria-label="Next message" size="icon-xs" variant="outline" disabled>
                  <ArrowRight />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-[7rem] flex-col justify-center text-sm">
              Contact form submissions will show up here.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm">
              {messages.length.toLocaleString()} open
            </div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">
              Latest contact form activity
            </div>
          </div>

          {avatars.length > 0 ? (
            <AvatarGroup>
              {avatars.map((m) => (
                <Avatar key={m.id}>
                  <AvatarFallback>{initials(m.name) || "?"}</AvatarFallback>
                </Avatar>
              ))}
              {messages.length > avatars.length ? (
                <AvatarGroupCount>+{messages.length - avatars.length}</AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
