"use client";

import { CheckCircle2, FileClock, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GovernanceCenter } from "@/components/admin/governance-center";
import { EmployeeCheckInTracker, ManagerCheckInTracker } from "@/components/checkins/checkin-tracker";
import { MetricStrip } from "@/components/dashboard/metric-strip";
import { GoalHealthCards } from "@/components/goals/goal-health-cards";
import { GoalWorkspace } from "@/components/goals/goal-workspace";
import { SharedKpiManager } from "@/components/goals/shared-kpi-manager";
import { DashboardShell, defaultModuleForRole } from "@/components/layout/dashboard-shell";
import { ApprovalDesk } from "@/components/manager/approval-desk";
import { TeamActions } from "@/components/manager/team-actions";
import { AnalyticsDashboard } from "@/components/reports/analytics-dashboard";
import { ReportingConsole } from "@/components/reports/reporting-console";
import { seedData } from "@/lib/demo/seed-data";
import { checkInState, getEmployeeSheet, getSheetGoals, getUser, nowIso, uid, validateGoalSheet } from "@/lib/domain/rules";
import type { AlignHqData, AppUser, CycleWindow, Goal, GoalSheetState, GoalUpdate, Quarter, Role } from "@/types/alignhq";

const STORAGE_KEY = "alignhq-next-demo-state";

const initialUserByRole: Record<Role, string> = {
  Employee: "emp-asha",
  Manager: "mgr-isha",
  Admin: "admin-priya"
};

export function AlignHqDashboard({ initialRole }: { initialRole: Role }) {
  const [data, setData] = useState<AlignHqData>(seedData);
  const [activeUserId, setActiveUserId] = useState(initialUserByRole[initialRole]);
  const [activeModule, setActiveModule] = useState(defaultModuleForRole(initialRole));
  const [quarter, setQuarter] = useState<Quarter>("Q1");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved) as AlignHqData);
      } catch {
        setData(seedData);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const activeUser = getUser(data, activeUserId);

  const handleUserChange = (userId: string) => {
    const user = getUser(data, userId);
    setActiveUserId(userId);
    setActiveModule(defaultModuleForRole(user.role));
  };

  const currentSheet = activeUser.role === "Employee" ? getEmployeeSheet(data, activeUser.id) : data.goalSheets[0];
  const currentGoals = activeUser.role === "Employee" ? getSheetGoals(data, currentSheet.id) : [];

  const teamSheets = useMemo(() => {
    const reports = data.users.filter((user) => user.managerId === activeUser.id).map((user) => user.id);
    return data.goalSheets.filter((sheet) => reports.includes(sheet.employeeId));
  }, [activeUser.id, data.goalSheets, data.users]);

  const audit = (actorId: string, action: string, entityType: string, entityId: string, previousValue: string, newValue: string, reason: string) => {
    setData((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: uid("audit"),
          actorId,
          action,
          entityType,
          entityId,
          previousValue,
          newValue,
          reason,
          createdAt: nowIso()
        },
        ...prev.auditLogs
      ]
    }));
  };

  const patchGoal = (goalId: string, patch: Partial<Goal>, reason = "Goal field updated") => {
    const previous = data.goals.find((goal) => goal.id === goalId);
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal))
    }));
    audit(activeUser.id, "Edited goal", "goal", goalId, JSON.stringify(previous ?? {}), JSON.stringify(patch), reason);
  };

  const addGoal = () => {
    const goals = getSheetGoals(data, currentSheet.id);
    if (goals.length >= 8) return;
    const goal: Goal = {
      id: uid("goal"),
      sheetId: currentSheet.id,
      employeeId: currentSheet.employeeId,
      thrustArea: "Operational Excellence",
      title: "",
      description: "",
      uomType: "Numeric",
      progressDirection: "Min",
      target: "",
      weightage: 10,
      locked: false,
      updates: {}
    };
    setData((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
    audit(activeUser.id, "Added goal", "goal_sheet", currentSheet.id, "-", goal.id, "Employee added draft goal");
  };

  const removeGoal = (goalId: string) => {
    setData((prev) => ({ ...prev, goals: prev.goals.filter((goal) => goal.id !== goalId) }));
    audit(activeUser.id, "Removed goal", "goal", goalId, goalId, "-", "Employee removed draft goal");
  };

  const updateSheetState = (sheetId: string, state: GoalSheetState, reason: string, returnedComment?: string) => {
    const sheet = data.goalSheets.find((item) => item.id === sheetId);
    if (!sheet) return;
    setData((prev) => ({
      ...prev,
      goalSheets: prev.goalSheets.map((item) => (item.id === sheetId ? { ...item, state, returnedComment, lockedAt: state === "Locked" ? nowIso() : item.lockedAt } : item)),
      goals: prev.goals.map((goal) => (goal.sheetId === sheetId && state === "Locked" ? { ...goal, locked: true } : goal))
    }));
    audit(activeUser.id, `Moved sheet to ${state}`, "goal_sheet", sheetId, sheet.state, state, reason);
  };

  const submitSheet = () => {
    const validation = validateGoalSheet(currentGoals);
    if (!validation.valid) return;
    updateSheetState(currentSheet.id, "Submitted", "Submitted for L1 approval");
  };

  const approveSheet = (sheetId: string) => {
    const goals = getSheetGoals(data, sheetId);
    if (!validateGoalSheet(goals).valid) return;
    updateSheetState(sheetId, "Locked", "Manager approved goals; sheet locked");
  };

  const returnSheet = (sheetId: string, comment: string) => {
    updateSheetState(sheetId, "Returned", comment, comment);
  };

  const unlockSheet = (sheetId: string, reason: string) => {
    const sheet = data.goalSheets.find((item) => item.id === sheetId);
    if (!sheet || !reason.trim()) return;
    setData((prev) => ({
      ...prev,
      goalSheets: prev.goalSheets.map((item) => (item.id === sheetId ? { ...item, state: "Returned", returnedComment: reason } : item)),
      goals: prev.goals.map((goal) => (goal.sheetId === sheetId ? { ...goal, locked: false } : goal))
    }));
    audit(activeUser.id, "Unlocked approved goals", "goal_sheet", sheetId, sheet.state, "Returned", reason);
  };

  const updateQuarterly = (goal: Goal, patch: Partial<GoalUpdate>) => {
    const nextUpdate: GoalUpdate = {
      quarter,
      actual: goal.updates[quarter]?.actual ?? "",
      status: goal.updates[quarter]?.status ?? "On Track",
      blocked: goal.updates[quarter]?.blocked ?? false,
      ...patch,
      submittedAt: nowIso()
    };
    const syncShared = goal.sharedGoalId && goal.primaryOwnerId === goal.employeeId;
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((item) => {
        if (item.id === goal.id || (syncShared && item.sharedGoalId === goal.sharedGoalId)) {
          return { ...item, updates: { ...item.updates, [quarter]: nextUpdate } };
        }
        return item;
      })
    }));
    audit(activeUser.id, "Submitted quarterly update", "goal", goal.id, JSON.stringify(goal.updates[quarter] ?? {}), JSON.stringify(nextUpdate), syncShared ? "Primary owner update synced to shared goal recipients" : "Quarterly actual updated");
  };

  const addManagerComment = (sheetId: string, goalId: string, comment: string) => {
    if (!comment.trim()) return;
    setData((prev) => ({
      ...prev,
      managerComments: [
        {
          id: uid("comment"),
          sheetId,
          goalId,
          managerId: activeUser.id,
          quarter,
          comment,
          createdAt: nowIso()
        },
        ...prev.managerComments
      ]
    }));
    audit(activeUser.id, "Added check-in comment", "goal", goalId, "-", comment, "Manager quarterly check-in");
  };

  const updateWindow = (windowId: string, patch: Partial<CycleWindow>) => {
    setData((prev) => ({
      ...prev,
      cycleWindows: prev.cycleWindows.map((window) => (window.id === windowId ? { ...window, ...patch } : window))
    }));
    audit(activeUser.id, "Updated cycle window", "cycle_window", windowId, "-", JSON.stringify(patch), "Admin configured cycle window");
  };

  const resetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setData(seedData);
    setActiveUserId(initialUserByRole[initialRole]);
    setActiveModule(defaultModuleForRole(initialRole));
  };

  const metrics = useMemo(() => {
    const locked = data.goalSheets.filter((sheet) => sheet.state === "Locked").length;
    const submitted = data.goalSheets.filter((sheet) => sheet.state === "Submitted").length;
    const completed = data.goalSheets.filter((sheet) => checkInState(getSheetGoals(data, sheet.id), quarter) === "Check-in Completed").length;
    return [
      { label: "Locked sheets", value: `${locked}/${data.goalSheets.length}`, icon: Lock },
      { label: "Pending approvals", value: String(submitted), icon: FileClock },
      { label: `${quarter} completed`, value: `${completed}/${data.goalSheets.length}`, icon: CheckCircle2 }
    ];
  }, [data, quarter]);

  return (
    <DashboardShell
      users={data.users}
      activeUser={activeUser}
      activeModule={activeModule}
      quarter={quarter}
      onUserChange={handleUserChange}
      onModuleChange={setActiveModule}
      onQuarterChange={setQuarter}
      onReset={resetDemo}
    >
      <MetricStrip metrics={metrics} />
      {activeModule === "workspace" ? (
        <GoalWorkspace data={data} activeUser={activeUser as AppUser} sheet={currentSheet} goals={currentGoals} onPatchGoal={patchGoal} onAddGoal={addGoal} onRemoveGoal={removeGoal} onSubmit={submitSheet} />
      ) : null}
      {activeModule === "checkins" ? <EmployeeCheckInTracker data={data} goals={currentGoals} quarter={quarter} onUpdate={updateQuarterly} /> : null}
      {activeModule === "health" ? <GoalHealthCards goals={currentGoals} quarter={quarter} /> : null}
      {activeModule === "approval" ? <ApprovalDesk data={data} teamSheets={teamSheets} onPatchGoal={patchGoal} onApprove={approveSheet} onReturn={returnSheet} /> : null}
      {activeModule === "team-checkins" ? <ManagerCheckInTracker data={data} teamSheets={teamSheets} quarter={quarter} onAddComment={addManagerComment} /> : null}
      {activeModule === "team-actions" ? <TeamActions data={data} teamSheets={teamSheets} quarter={quarter} /> : null}
      {activeModule === "shared" ? <SharedKpiManager data={data} activeUser={activeUser} onPatchGoal={patchGoal} /> : null}
      {activeModule === "governance" ? <GovernanceCenter data={data} quarter={quarter} onUnlock={unlockSheet} onUpdateWindow={updateWindow} /> : null}
      {activeModule === "reports" ? <ReportingConsole data={data} quarter={quarter} /> : null}
      {activeModule === "analytics" ? <AnalyticsDashboard data={data} quarter={quarter} /> : null}
    </DashboardShell>
  );
}
