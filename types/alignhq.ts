export type Role = "Employee" | "Manager" | "Admin";
export type GoalSheetState = "Draft" | "Submitted" | "Returned" | "Approved" | "Locked";
export type CheckInState = "Check-in Pending" | "Check-in Completed";
export type UomType = "Numeric" | "Percentage" | "Timeline" | "Zero-based";
export type ProgressDirection = "Min" | "Max";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type GoalStatus = "Not Started" | "On Track" | "Completed";
export type GoalHealth = "Healthy" | "Needs Attention" | "Delayed" | "Blocked";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  managerId?: string;
};

export type GoalUpdate = {
  quarter: Quarter;
  actual: string;
  status: GoalStatus;
  blocked: boolean;
  submittedAt?: string;
};

export type Goal = {
  id: string;
  sheetId: string;
  employeeId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: UomType;
  progressDirection: ProgressDirection;
  target: string;
  weightage: number;
  locked: boolean;
  sharedGoalId?: string;
  primaryOwnerId?: string;
  updates: Partial<Record<Quarter, GoalUpdate>>;
};

export type GoalSheet = {
  id: string;
  employeeId: string;
  cycle: string;
  state: GoalSheetState;
  returnedComment?: string;
  lockedAt?: string;
};

export type ManagerComment = {
  id: string;
  sheetId: string;
  goalId: string;
  managerId: string;
  quarter: Quarter;
  comment: string;
  createdAt: string;
};

export type SharedGoal = {
  id: string;
  title: string;
  description: string;
  thrustArea: string;
  target: string;
  uomType: UomType;
  progressDirection: ProgressDirection;
  primaryOwnerId: string;
};

export type CycleWindow = {
  id: string;
  label: string;
  quarter?: Quarter;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
};

export type AlignHqData = {
  users: AppUser[];
  goalSheets: GoalSheet[];
  goals: Goal[];
  managerComments: ManagerComment[];
  sharedGoals: SharedGoal[];
  cycleWindows: CycleWindow[];
  auditLogs: AuditLog[];
};
