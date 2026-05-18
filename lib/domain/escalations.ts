import type { AlignHqData, AppUser, CycleWindow, GoalSheet, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser, quarters } from "@/lib/domain/rules";

export type EscalationSeverity = "Reminder" | "Escalated";
export type EscalationKind = "Goal submission" | "Manager approval" | "Quarterly check-in";

export type EscalationItem = {
  id: string;
  kind: EscalationKind;
  severity: EscalationSeverity;
  owner: AppUser;
  manager?: AppUser;
  hr: AppUser;
  sheet: GoalSheet;
  window: CycleWindow;
  dueDate: string;
  chain: string[];
  reason: string;
  deepLink: string;
};

function daysBetween(dateA: Date, dateB: Date) {
  const msPerDay = 86_400_000;
  return Math.ceil((dateA.getTime() - dateB.getTime()) / msPerDay);
}

function activeGoalWindow(data: AlignHqData) {
  return data.cycleWindows.find((window) => window.label.toLowerCase().includes("goal"));
}

function quarterWindow(data: AlignHqData, quarter: Quarter) {
  return data.cycleWindows.find((window) => window.quarter === quarter);
}

function adminUser(data: AlignHqData) {
  return data.users.find((user) => user.role === "Admin") ?? data.users[0];
}

function escalationBase(data: AlignHqData, sheet: GoalSheet, window: CycleWindow, kind: EscalationKind, reason: string, severity: EscalationSeverity, path: string): EscalationItem {
  const owner = getUser(data, sheet.employeeId);
  const manager = owner.managerId ? getUser(data, owner.managerId) : undefined;
  const hr = adminUser(data);

  return {
    id: `${kind}-${sheet.id}-${window.id}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    kind,
    severity,
    owner,
    manager,
    hr,
    sheet,
    window,
    dueDate: window.endsAt,
    chain: [owner.name, manager?.name, "Skip-level / HR"].filter(Boolean) as string[],
    reason,
    deepLink: path
  };
}

export function buildEscalationItems(data: AlignHqData, quarter: Quarter, now = new Date()): EscalationItem[] {
  const items: EscalationItem[] = [];
  const goalWindow = activeGoalWindow(data);
  const qWindow = quarterWindow(data, quarter);

  data.goalSheets.forEach((sheet) => {
    if (goalWindow && ["Draft", "Returned"].includes(sheet.state)) {
      const daysToGoalDue = daysBetween(new Date(goalWindow.endsAt), now);
      if (daysToGoalDue <= 14) {
        items.push(
          escalationBase(
            data,
            sheet,
            goalWindow,
            "Goal submission",
            daysToGoalDue < 0 ? "Employee goal sheet is past the active submission window." : "Employee goal sheet is inside the submission reminder window.",
            daysToGoalDue < 0 ? "Escalated" : "Reminder",
            `/employee?sheet=${sheet.id}`
          )
        );
      }
    }

    if (goalWindow && sheet.state === "Submitted") {
      const daysToApprovalDue = daysBetween(new Date(goalWindow.endsAt), now);
      items.push(
        escalationBase(
          data,
          sheet,
          goalWindow,
          "Manager approval",
          daysToApprovalDue < 0 ? "Manager approval is overdue for a submitted goal sheet." : "Manager approval is pending for a submitted goal sheet.",
          daysToApprovalDue < 0 ? "Escalated" : "Reminder",
          `/manager?sheet=${sheet.id}`
        )
      );
    }

    if (qWindow?.active && checkInState(getSheetGoals(data, sheet.id), quarter) === "Check-in Pending") {
      const daysToCheckInDue = daysBetween(new Date(qWindow.endsAt), now);
      if (daysToCheckInDue <= 14) {
        items.push(
          escalationBase(
            data,
            sheet,
            qWindow,
            "Quarterly check-in",
            daysToCheckInDue < 0 ? `${quarter} check-in is past the active window.` : `${quarter} check-in is inside the reminder window.`,
            daysToCheckInDue < 0 ? "Escalated" : "Reminder",
            `/employee?quarter=${quarter}&sheet=${sheet.id}`
          )
        );
      }
    }
  });

  return items.sort((a, b) => {
    const severityRank = a.severity === b.severity ? 0 : a.severity === "Escalated" ? -1 : 1;
    return severityRank || quarters.indexOf(quarter) || a.owner.name.localeCompare(b.owner.name);
  });
}
