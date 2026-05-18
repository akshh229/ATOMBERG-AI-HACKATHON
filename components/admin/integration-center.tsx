"use client";

import type { LucideIcon } from "lucide-react";
import { Building2, CheckCircle2, KeyRound, Mail, MessageSquare, ShieldCheck, Users } from "lucide-react";
import type { AlignHqData } from "@/types/alignhq";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const roleMappings = [
  { group: "AlignHQ-Employees", role: "Employee", scope: "Goal owners and check-ins" },
  { group: "AlignHQ-Managers", role: "Manager", scope: "Direct-report approval and comments" },
  { group: "AlignHQ-HR-Admins", role: "Admin", scope: "Governance, audit, exports, unlocks" }
];

export function IntegrationCenter({ data }: { data: AlignHqData }) {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasEntraClient = Boolean(process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID);
  const managers = data.users.filter((user) => user.role === "Manager").length;
  const employees = data.users.filter((user) => user.role === "Employee").length;
  const mappedUsers = data.users.filter((user) => user.email.endsWith("@alignhq.test")).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Microsoft identity and collaboration</CardTitle>
          <p className="text-sm text-stone-600">SSO, hierarchy, group-role mapping, and notification readiness.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <StatusTile icon={ShieldCheck} label="Supabase Auth" ready={hasSupabase} value={hasSupabase ? "Configured" : "Missing env"} />
            <StatusTile icon={KeyRound} label="Entra ID / Azure AD SSO" ready={hasEntraClient} value={hasEntraClient ? "Client registered" : "Provider pending"} />
            <StatusTile icon={Mail} label="Email notifications" ready value="Dispatch-ready" />
            <StatusTile icon={MessageSquare} label="Microsoft Teams" ready value="Adaptive cards" />
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Azure AD group</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleMappings.map((mapping) => (
                  <TableRow key={mapping.group}>
                    <TableCell className="font-medium">{mapping.group}</TableCell>
                    <TableCell><Badge variant="secondary">{mapping.role}</Badge></TableCell>
                    <TableCell>{mapping.scope}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Org hierarchy sync</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Kpi icon={Users} label="Employees" value={employees} />
            <Kpi icon={Building2} label="Managers" value={managers} />
            <Kpi icon={CheckCircle2} label="Mapped profiles" value={mappedUsers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSO callback</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-stone-600">
            <code className="rounded bg-stone-100 px-2 py-1 text-stone-900">/login</code>
            <div className="mt-3">Role is resolved from the mapped Supabase profile after Entra sign-in.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusTile({ icon: Icon, label, value, ready }: { icon: LucideIcon; label: string; value: string; ready: boolean }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-5 text-[hsl(var(--primary))]" />
        <Badge variant={ready ? "success" : "warning"}>{ready ? "Ready" : "Pending"}</Badge>
      </div>
      <div className="mt-3 font-medium">{label}</div>
      <p className="mt-1 text-sm text-stone-600">{value}</p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
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
