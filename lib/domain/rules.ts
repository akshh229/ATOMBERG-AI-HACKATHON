import type { AlignHqData, CheckInState, Goal, GoalHealth, GoalSheet, GoalUpdate, Quarter } from "@/types/alignhq";

export const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export const thrustAreas = [
  "Revenue Growth",
  "Operational Excellence",
  "Customer Experience",
  "People Capability",
  "Risk and Compliance",
  "Product Adoption"
];

export function nowIso() {
  return new Date().toISOString();
}

export function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getUser(data: AlignHqData, id: string) {
  const user = data.users.find((item) => item.id === id);
  if (!user) throw new Error(`Unknown user: ${id}`);
  return user;
}

export function getSheetGoals(data: AlignHqData, sheetId: string) {
  return data.goals.filter((goal) => goal.sheetId === sheetId);
}

export function getEmployeeSheet(data: AlignHqData, employeeId: string) {
  const sheet = data.goalSheets.find((item) => item.employeeId === employeeId);
  if (!sheet) throw new Error(`No goal sheet for employee: ${employeeId}`);
  return sheet;
}

export function validateGoalSheet(goals: Goal[]) {
  const errors: string[] = [];
  const totalWeightage = goals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);

  if (goals.length === 0) errors.push("Add at least one goal before submission.");
  if (goals.length > 8) errors.push("Maximum 8 goals are allowed per employee.");
  if (totalWeightage !== 100) errors.push(`Total weightage must equal 100%. Current total is ${totalWeightage}%.`);
  if (goals.some((goal) => Number(goal.weightage) < 10)) errors.push("Minimum weightage per goal is 10%.");
  if (goals.some((goal) => !goal.thrustArea || !goal.title.trim() || !goal.description.trim() || !goal.target.trim())) {
    errors.push("Every goal requires thrust area, title, description, UoM, target, and weightage.");
  }

  return { valid: errors.length === 0, errors, totalWeightage };
}

export function progressScore(goal: Goal, quarter: Quarter) {
  const update = goal.updates[quarter];
  return progressScoreFromUpdate(goal, update);
}

export function progressScoreFromUpdate(goal: Goal, update?: GoalUpdate) {
  if (!update || !update.actual || update.blocked) return 0;

  if (goal.uomType === "Zero-based") {
    return Number(update.actual) === 0 ? 100 : 0;
  }

  if (goal.uomType === "Timeline") {
    const deadline = new Date(goal.target).getTime();
    const actual = new Date(update.actual).getTime();
    if (Number.isNaN(deadline) || Number.isNaN(actual)) return 0;
    if (actual <= deadline) return 100;
    const daysLate = Math.ceil((actual - deadline) / 86_400_000);
    return Math.max(0, 100 - daysLate * 5);
  }

  const target = Number(goal.target);
  const actual = Number(update.actual);
  if (!target || !actual) return 0;

  const raw = goal.progressDirection === "Min" ? (actual / target) * 100 : (target / actual) * 100;
  return Math.round(Math.max(0, Math.min(150, raw)));
}

export function goalHealth(goal: Goal, quarter: Quarter): GoalHealth {
  const update = goal.updates[quarter];
  const score = progressScore(goal, quarter);

  if (update?.blocked) return "Blocked";
  if (!update?.submittedAt || update.status === "Not Started") return "Needs Attention";
  if (update.status === "Completed" && score >= 90) return "Healthy";
  if (score >= 80) return "Healthy";
  if (score >= 55) return "Needs Attention";
  return "Delayed";
}

export function checkInState(goals: Goal[], quarter: Quarter): CheckInState {
  return goals.every((goal) => goal.updates[quarter]?.submittedAt) ? "Check-in Completed" : "Check-in Pending";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function createAchievementCsv(data: AlignHqData, quarter: Quarter) {
  const rows = [
    ["Employee", "Manager", "Department", "Cycle", "Goal Sheet State", "Goal", "UoM", "Target", "Weightage", `${quarter} Actual`, `${quarter} Status`, `${quarter} Score`, "Health"]
  ];

  data.goalSheets.forEach((sheet) => {
    const employee = getUser(data, sheet.employeeId);
    const manager = employee.managerId ? getUser(data, employee.managerId) : undefined;
    getSheetGoals(data, sheet.id).forEach((goal) => {
      const update = goal.updates[quarter];
      rows.push([
        employee.name,
        manager?.name ?? "",
        employee.department,
        sheet.cycle,
        sheet.state,
        goal.title,
        goal.uomType,
        goal.target,
        String(goal.weightage),
        update?.actual ?? "",
        update?.status ?? "",
        String(progressScore(goal, quarter)),
        goalHealth(goal, quarter)
      ]);
    });
  });

  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function canEditSheet(sheet: GoalSheet) {
  return sheet.state === "Draft" || sheet.state === "Returned";
}
