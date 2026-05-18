import type { AlignHqData } from "@/types/alignhq";

export const seedData: AlignHqData = {
  users: [
    { id: "emp-asha", name: "Asha Menon", email: "asha.menon@alignhq.test", role: "Employee", title: "Regional Sales Executive", department: "Sales", managerId: "mgr-isha" },
    { id: "emp-rahul", name: "Rahul Bansal", email: "rahul.bansal@alignhq.test", role: "Employee", title: "Channel Growth Lead", department: "Sales", managerId: "mgr-isha" },
    { id: "emp-neha", name: "Neha Shah", email: "neha.shah@alignhq.test", role: "Employee", title: "Fulfilment Analyst", department: "Operations", managerId: "mgr-vikram" },
    { id: "emp-kabir", name: "Kabir Suri", email: "kabir.suri@alignhq.test", role: "Employee", title: "Product Analyst", department: "Product", managerId: "mgr-vikram" },
    { id: "emp-mira", name: "Mira Kapoor", email: "mira.kapoor@alignhq.test", role: "Employee", title: "HR Operations Partner", department: "HR", managerId: "mgr-isha" },
    { id: "mgr-isha", name: "Isha Rao", email: "isha.rao@alignhq.test", role: "Manager", title: "Sales Manager", department: "Sales" },
    { id: "mgr-vikram", name: "Vikram Sethi", email: "vikram.sethi@alignhq.test", role: "Manager", title: "Operations Manager", department: "Operations" },
    { id: "admin-priya", name: "Priya Nair", email: "priya.nair@alignhq.test", role: "Admin", title: "HR Business Partner", department: "HR" }
  ],
  goalSheets: [
    { id: "sheet-asha", employeeId: "emp-asha", cycle: "FY26", state: "Draft" },
    { id: "sheet-rahul", employeeId: "emp-rahul", cycle: "FY26", state: "Submitted" },
    { id: "sheet-neha", employeeId: "emp-neha", cycle: "FY26", state: "Locked", lockedAt: "2026-05-28T11:15:00.000Z" },
    { id: "sheet-kabir", employeeId: "emp-kabir", cycle: "FY26", state: "Returned", returnedComment: "Please split product adoption into measurable milestones." },
    { id: "sheet-mira", employeeId: "emp-mira", cycle: "FY26", state: "Approved" }
  ],
  sharedGoals: [
    {
      id: "shared-dealer-activation",
      title: "Launch quarterly dealer activation KPI",
      description: "Departmental activation target for channel-facing functions.",
      thrustArea: "Revenue Growth",
      target: "80",
      uomType: "Numeric",
      progressDirection: "Min",
      primaryOwnerId: "emp-rahul"
    }
  ],
  goals: [
    {
      id: "goal-a1",
      sheetId: "sheet-asha",
      employeeId: "emp-asha",
      thrustArea: "Revenue Growth",
      title: "Increase qualified dealer pipeline",
      description: "Build and progress a qualified pipeline for priority territories.",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "120",
      weightage: 40,
      locked: false,
      updates: {}
    },
    {
      id: "goal-a2",
      sheetId: "sheet-asha",
      employeeId: "emp-asha",
      thrustArea: "Customer Experience",
      title: "Improve dealer response SLA",
      description: "Improve response discipline for dealer service requests.",
      uomType: "Percentage",
      progressDirection: "Min",
      target: "92",
      weightage: 30,
      locked: false,
      updates: {}
    },
    {
      id: "goal-a3",
      sheetId: "sheet-asha",
      employeeId: "emp-asha",
      thrustArea: "Operational Excellence",
      title: "Complete territory plan refresh",
      description: "Submit updated coverage plan for all assigned districts.",
      uomType: "Timeline",
      progressDirection: "Min",
      target: "2026-07-31",
      weightage: 20,
      locked: false,
      updates: {}
    },
    {
      id: "goal-r1",
      sheetId: "sheet-rahul",
      employeeId: "emp-rahul",
      thrustArea: "Revenue Growth",
      title: "Launch quarterly dealer activation KPI",
      description: "Shared KPI assigned to channel and operations participants.",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "80",
      weightage: 35,
      locked: false,
      sharedGoalId: "shared-dealer-activation",
      primaryOwnerId: "emp-rahul",
      updates: {}
    },
    {
      id: "goal-r2",
      sheetId: "sheet-rahul",
      employeeId: "emp-rahul",
      thrustArea: "Customer Experience",
      title: "Reduce escalation backlog",
      description: "Close pending escalations older than 14 days.",
      uomType: "Zero-based",
      progressDirection: "Min",
      target: "0",
      weightage: 30,
      locked: false,
      updates: {}
    },
    {
      id: "goal-r3",
      sheetId: "sheet-rahul",
      employeeId: "emp-rahul",
      thrustArea: "People Capability",
      title: "Coach partner success representatives",
      description: "Run enablement sessions and document action items.",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "6",
      weightage: 35,
      locked: false,
      updates: {}
    },
    {
      id: "goal-n1",
      sheetId: "sheet-neha",
      employeeId: "emp-neha",
      thrustArea: "Operational Excellence",
      title: "Launch quarterly dealer activation KPI",
      description: "Shared KPI reporting support for operations.",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "80",
      weightage: 25,
      locked: true,
      sharedGoalId: "shared-dealer-activation",
      primaryOwnerId: "emp-rahul",
      updates: { Q1: { quarter: "Q1", actual: "64", status: "On Track", blocked: false, submittedAt: "2026-07-18T10:30:00.000Z" } }
    },
    {
      id: "goal-n2",
      sheetId: "sheet-neha",
      employeeId: "emp-neha",
      thrustArea: "Risk and Compliance",
      title: "Reduce dispatch reconciliation gaps",
      description: "Keep monthly reconciliation exceptions below agreed threshold.",
      uomType: "Percentage",
      progressDirection: "Max",
      target: "2",
      weightage: 35,
      locked: true,
      updates: { Q1: { quarter: "Q1", actual: "3", status: "On Track", blocked: false, submittedAt: "2026-07-20T09:10:00.000Z" } }
    },
    {
      id: "goal-n3",
      sheetId: "sheet-neha",
      employeeId: "emp-neha",
      thrustArea: "Customer Experience",
      title: "Complete service handoff SOP",
      description: "Publish final SOP for dispatch-to-service handoff.",
      uomType: "Timeline",
      progressDirection: "Min",
      target: "2026-07-25",
      weightage: 40,
      locked: true,
      updates: { Q1: { quarter: "Q1", actual: "2026-07-29", status: "Completed", blocked: false, submittedAt: "2026-07-29T12:20:00.000Z" } }
    },
    {
      id: "goal-k1",
      sheetId: "sheet-kabir",
      employeeId: "emp-kabir",
      thrustArea: "Product Adoption",
      title: "Improve dashboard adoption",
      description: "Increase weekly active usage among sales managers.",
      uomType: "Percentage",
      progressDirection: "Min",
      target: "70",
      weightage: 50,
      locked: false,
      updates: {}
    },
    {
      id: "goal-k2",
      sheetId: "sheet-kabir",
      employeeId: "emp-kabir",
      thrustArea: "Operational Excellence",
      title: "Reduce insight turnaround time",
      description: "Reduce cycle time for monthly insight requests.",
      uomType: "Numeric",
      progressDirection: "Max",
      target: "5",
      weightage: 50,
      locked: false,
      updates: {}
    },
    {
      id: "goal-m1",
      sheetId: "sheet-mira",
      employeeId: "emp-mira",
      thrustArea: "People Capability",
      title: "Improve goal completion readiness",
      description: "Run readiness clinics for managers before review windows.",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "4",
      weightage: 60,
      locked: false,
      updates: {}
    },
    {
      id: "goal-m2",
      sheetId: "sheet-mira",
      employeeId: "emp-mira",
      thrustArea: "Risk and Compliance",
      title: "Close audit exceptions",
      description: "Close outstanding exceptions from prior goal cycle audit.",
      uomType: "Zero-based",
      progressDirection: "Min",
      target: "0",
      weightage: 40,
      locked: false,
      updates: {}
    }
  ],
  managerComments: [
    {
      id: "comment-1",
      sheetId: "sheet-neha",
      goalId: "goal-n2",
      managerId: "mgr-vikram",
      quarter: "Q1",
      comment: "Good root-cause visibility. Split vendor-driven exceptions in Q2.",
      createdAt: "2026-07-22T14:00:00.000Z"
    }
  ],
  cycleWindows: [
    { id: "window-goals", label: "Goal Setting", startsAt: "2026-05-01", endsAt: "2026-05-31", active: true },
    { id: "window-q1", label: "Q1 Update", quarter: "Q1", startsAt: "2026-07-01", endsAt: "2026-07-31", active: true },
    { id: "window-q2", label: "Q2 Update", quarter: "Q2", startsAt: "2026-10-01", endsAt: "2026-10-31", active: false },
    { id: "window-q3", label: "Q3 Update", quarter: "Q3", startsAt: "2027-01-01", endsAt: "2027-01-31", active: false },
    { id: "window-q4", label: "Q4 / Annual Update", quarter: "Q4", startsAt: "2027-03-01", endsAt: "2027-04-15", active: false }
  ],
  auditLogs: [
    {
      id: "audit-1",
      actorId: "mgr-vikram",
      action: "Approved and locked goal sheet",
      entityType: "goal_sheet",
      entityId: "sheet-neha",
      previousValue: "Submitted",
      newValue: "Locked",
      reason: "Goals reviewed for FY26",
      createdAt: "2026-05-28T11:15:00.000Z"
    }
  ]
};
