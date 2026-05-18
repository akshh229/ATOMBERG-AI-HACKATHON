"use client";

import { BellRing, CheckCircle2, FileClock, Lock } from "lucide-react";
import type { AlignHqData, Quarter } from "@/types/alignhq";
import { buildEscalationItems } from "@/lib/domain/escalations";
import { checkInState, getSheetGoals } from "@/lib/domain/rules";

export function WorkflowPulse({ data, dataMode, quarter }: { data: AlignHqData; dataMode: "loading" | "supabase" | "local"; quarter: Quarter }) {
  const locked = data.goalSheets.filter((sheet) => sheet.state === "Locked").length;
  const pendingApprovals = data.goalSheets.filter((sheet) => sheet.state === "Submitted").length;
  const completed = data.goalSheets.filter((sheet) => checkInState(getSheetGoals(data, sheet.id), quarter) === "Check-in Completed").length;
  const escalations = buildEscalationItems(data, quarter).length;
  const syncLabel = dataMode === "supabase" ? "Live Supabase sync" : dataMode === "local" ? "Local demo sync" : "Connecting";

  const items = [
    { label: "Locked sheets", value: `${locked}/${data.goalSheets.length}`, icon: Lock, tone: "teal" },
    { label: "Pending approvals", value: pendingApprovals, icon: FileClock, tone: "amber" },
    { label: `${quarter} check-ins`, value: `${completed}/${data.goalSheets.length}`, icon: CheckCircle2, tone: "emerald" },
    { label: "Escalations", value: escalations, icon: BellRing, tone: "red" }
  ];

  return (
    <section className="live-ribbon mb-5 rounded-lg border bg-white p-4 shadow-sm" aria-label="Live workflow pulse">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="pulse-dot" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-stone-950">Goal cycle live pulse</div>
            <p className="text-xs text-stone-500">{syncLabel} · FY26 · {quarter}</p>
          </div>
        </div>
        <div className="ticker-shell" aria-hidden="true">
          <div className="ticker-track">
            <span>Draft</span>
            <span>Submitted</span>
            <span>Approved</span>
            <span>Locked</span>
            <span>Checked in</span>
            <span>Reported</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="workflow-stat interactive-lift rounded-lg border bg-stone-50 p-3" data-tone={item.tone}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-stone-500">{item.label}</div>
                <Icon className="size-4 text-[hsl(var(--primary))]" />
              </div>
              <div className="mt-2 tabular-nums text-2xl font-semibold text-stone-950">{item.value}</div>
              <div className="signal-stack mt-3" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
