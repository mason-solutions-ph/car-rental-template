import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminContactMessages } from "@/lib/admin/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format/date";

export const metadata = { title: "Contact messages" };

export default async function AdminMessagesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect Supabase to view contact messages.
      </p>
    );
  }

  const messages = await listAdminContactMessages();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">
          Contact form submissions from the marketing site.
        </p>
      </div>
      {messages.length === 0 ? (
        <Empty className="border border-dashed p-6">
          <EmptyHeader>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              When customers use the contact page, their notes will show up
              here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {formatDateTime(m.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-muted-foreground text-xs">
                        <a
                          href={`mailto:${m.email}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {m.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>{m.subject ?? "—"}</TableCell>
                    <TableCell className="max-w-md text-sm whitespace-pre-wrap">
                      {m.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
