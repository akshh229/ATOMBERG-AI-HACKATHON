"use client";

import type { LucideIcon } from "lucide-react";
import { BellRing, ExternalLink, GitBranch, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";
import type { AlignHqData, Quarter } from "@/types/alignhq";
import { buildEscalationItems } from "@/lib/domain/escalations";
import { buildNotificationPreviews } from "@/lib/integrations/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EscalationCenter({ data, quarter }: { data: AlignHqData; quarter: Quarter }) {
  const [dispatchState, setDispatchState] = useState<"idle" | "sending" | "sent">("idle");
  const [dispatchMessage, setDispatchMessage] = useState("");
  const escalations = buildEscalationItems(data, quarter);
  const notifications = buildNotificationPreviews(escalations, typeof window === "undefined" ? undefined : window.location.origin);
  const emailCount = notifications.filter((item) => item.channel === "Email").length;
  const teamsCount = notifications.filter((item) => item.channel === "Microsoft Teams").length;

  const dispatchEscalations = async () => {
    setDispatchState("sending");
    setDispatchMessage("");

    const response = await fetch("/api/integrations/dispatch-escalations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quarter, origin: window.location.origin })
    });
    const result = (await response.json()) as { sent: number; skipped: number; failed: number };

    setDispatchState("sent");
    setDispatchMessage(`${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed.`);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Escalation queue</CardTitle>
          <p className="text-sm text-stone-600">Rule-based exceptions across submissions, approvals, and active check-in windows.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Deep link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.severity === "Escalated" ? "danger" : "warning"}>{item.severity}</Badge>
                        <span className="font-medium">{item.kind}</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{item.reason}</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.owner.name}</div>
                      <div className="text-xs text-stone-500">{item.owner.department}</div>
                    </TableCell>
                    <TableCell className="tabular-nums">{item.dueDate}</TableCell>
                    <TableCell>{item.chain.join(" -> ")}</TableCell>
                    <TableCell>
                      <a className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))]" href={item.deepLink}>
                        Open <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
                {escalations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-stone-500">
                      No escalation rules are currently firing.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Notification dispatch</CardTitle>
              <p className="text-sm text-stone-600">Email and Teams delivery uses configured server webhooks.</p>
            </div>
            <Button size="sm" disabled={dispatchState === "sending" || notifications.length === 0} onClick={() => void dispatchEscalations()}>
              {dispatchState === "sending" ? "Sending" : "Dispatch"}
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Stat icon={Mail} label="Email notifications" value={emailCount} />
            <Stat icon={MessageSquare} label="Teams adaptive cards" value={teamsCount} />
            <Stat icon={GitBranch} label="Escalation chains" value={escalations.length} />
            {dispatchMessage ? <p className="rounded-md border bg-white p-3 text-sm text-stone-600">{dispatchMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin/HR log</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {escalations.slice(0, 6).map((item) => (
              <article key={`${item.id}-log`} className="grid grid-cols-[20px_1fr] gap-3 border-b pb-3 last:border-0">
                <BellRing className="mt-1 size-4 text-[hsl(var(--primary))]" />
                <div>
                  <div className="text-sm font-medium">{item.kind}</div>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {item.owner.name} {"->"} {item.manager?.name ?? item.hr.name} {"->"} HR
                  </p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3">
      <div className="flex items-center gap-2 text-sm text-stone-600">
        <Icon className="size-4 text-[hsl(var(--primary))]" />
        {label}
      </div>
      <div className="tabular-nums text-lg font-semibold">{value}</div>
    </div>
  );
}
