"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BellRing, CalendarClock, ClipboardCheck, FileText, Gauge, History, LogOut, RefreshCcw, ShieldCheck, Users, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import type { AppUser, Quarter, Role } from "@/types/alignhq";
import { quarters } from "@/lib/domain/rules";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const navByRole: Record<Role, NavItem[]> = {
  Employee: [
    { id: "workspace", label: "Goal Workspace", icon: FileText },
    { id: "checkins", label: "Quarterly Check-ins", icon: CalendarClock },
    { id: "health", label: "Goal Health Cards", icon: Gauge }
  ],
  Manager: [
    { id: "approval", label: "Approval Desk", icon: ClipboardCheck },
    { id: "team-checkins", label: "Team Check-ins", icon: CalendarClock },
    { id: "shared", label: "Shared KPIs", icon: Users },
    { id: "team-actions", label: "Team Actions", icon: History }
  ],
  Admin: [
    { id: "governance", label: "Governance Center", icon: ShieldCheck },
    { id: "reports", label: "Reports & Audit", icon: BarChart3 },
    { id: "escalations", label: "Escalations", icon: BellRing },
    { id: "integrations", label: "Integrations", icon: Workflow },
    { id: "shared", label: "Shared KPIs", icon: Users },
    { id: "analytics", label: "Analytics", icon: Gauge }
  ]
};

export function defaultModuleForRole(role: Role) {
  return navByRole[role][0].id;
}

export function DashboardShell({
  users,
  activeUser,
  activeModule,
  quarter,
  onUserChange,
  onModuleChange,
  onQuarterChange,
  onReset,
  children
}: {
  users: AppUser[];
  activeUser: AppUser;
  activeModule: string;
  quarter: Quarter;
  onUserChange: (userId: string) => void;
  onModuleChange: (moduleId: string) => void;
  onQuarterChange: (quarter: Quarter) => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const nav = navByRole[activeUser.role];
  const activeTitle = nav.find((item) => item.id === activeModule)?.label ?? "AlignHQ";

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-[hsl(var(--background))] lg:grid-cols-[280px_1fr]">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-950 focus:shadow" href="#main-content">
        Skip to main content
      </a>
      <aside className="flex bg-stone-800 p-5 text-stone-50 lg:min-h-dvh lg:flex-col">
        <div className="flex w-full flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))] font-bold text-white">A</div>
            <div>
              <div className="font-semibold">AlignHQ</div>
              <div className="text-xs text-stone-300">Goal operations</div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <label className="text-xs font-medium text-stone-300">Demo identity</label>
            <Select className="mt-2 bg-stone-50 text-stone-950" value={activeUser.id} onChange={(event) => onUserChange(event.target.value)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-pretty text-xs leading-5 text-stone-300">{activeUser.title}</p>
          </div>

          <nav className="grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-stone-100 hover:bg-white/10",
                    activeModule === item.id && "bg-white/10"
                  )}
                  aria-current={activeModule === item.id ? "page" : undefined}
                  onClick={() => onModuleChange(item.id)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-2">
            <Button variant="outline" className="justify-start border-white/15 bg-transparent text-stone-100 hover:bg-white/10" onClick={onReset}>
              <RefreshCcw className="size-4" />
              Reset demo data
            </Button>
            <Button asChild variant="ghost" className="justify-start text-stone-100 hover:bg-white/10">
              <Link href="/login">
                <LogOut className="size-4" />
                Role landing
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 p-5 lg:p-7">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">FY26 performance cycle</p>
            <h1 className="text-balance text-3xl font-semibold text-stone-950">{activeTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select className="w-28" value={quarter} onChange={(event) => onQuarterChange(event.target.value as Quarter)}>
              {quarters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Button asChild variant="secondary">
              <a href={`/api/reports/achievement?quarter=${quarter}`}>Export CSV</a>
            </Button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
