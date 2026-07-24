import { OpsEmptyState } from "@/components/admin/ops-empty-state";
import { OpsEmptyValue } from "@/components/admin/ops-empty-value";
import { OpsPanel } from "@/components/admin/ops-panel";
import {
  OpsSectionHeader,
  opsTableHeadClass,
} from "@/components/admin/ops-chrome";
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
    <section aria-labelledby="ops-inbox" className="flex flex-col gap-3">
      <OpsSectionHeader
        id="ops-inbox"
        title="Inbox"
        count={messages.length}
        description="Contact form submissions from the marketing site."
      />
      {messages.length === 0 ? (
        <OpsEmptyState
          title="No messages yet"
          description="When customers use the contact page, their notes will show up here."
        />
      ) : (
        <OpsPanel>
          <Table className="text-ui">
            <TableHeader>
              <TableRow>
                <TableHead className={opsTableHeadClass}>When</TableHead>
                <TableHead className={opsTableHeadClass}>From</TableHead>
                <TableHead className={opsTableHeadClass}>Subject</TableHead>
                <TableHead className={opsTableHeadClass}>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap tabular-nums">
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
                  <TableCell>
                    {m.subject ? (
                      m.subject
                    ) : (
                      <OpsEmptyValue label="No subject" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap">
                    {m.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </OpsPanel>
      )}
    </section>
  );
}
