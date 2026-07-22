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
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      {messages.length === 0 ? (
        <p className="text-muted-foreground text-sm">No messages yet.</p>
      ) : (
        <div className="rounded-xl border">
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
                      {m.email}
                    </div>
                  </TableCell>
                  <TableCell>{m.subject ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {m.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
