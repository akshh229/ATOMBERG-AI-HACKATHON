"use client";

import { CheckCircle2, FileClock, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EscalationCenter } from "@/components/admin/escalation-center";
import { GovernanceCenter } from "@/components/admin/governance-center";
import { IntegrationCenter } from "@/components/admin/integration-center";
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
import { WorkflowPulse } from "@/components/dashboard/workflow-pulse";
import { seedData } from "@/lib/demo/seed-data";
import { checkInState, getEmployeeSheet, getSheetGoals, getUser, nowIso, uid, validateGoalSheet } from "@/lib/domain/rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createAuditLog,
  createGoal,
  createManagerComment,
  deleteGoal,
  loadCurrentAppUser,
  loadAlignHqData,
  saveCycleWindowPatch,
  saveGoalPatch,
  saveGoalUpdate,
  saveSheetState
} from "@/lib/supabase/alignhq-repository";
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
  const [dataMode, setDataMode] = useState<"loading" | "supabase" | "local">("loading");
  const [dataNotice, setDataNotice] = useState("Loading workspace data...");
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | undefined>(undefined);

  useEffect(() => {
    setSupabase(createSupabaseBrowserClient());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (supabase === undefined) return;

      if (supabase) {
        try {
          const [remoteData, currentProfile] = await Promise.all([loadAlignHqData(supabase), loadCurrentAppUser(supabase)]);
          if (remoteData.users.length === 0) {
            throw new Error("Supabase returned no visible workspace rows");
          }
          if (cancelled) return;
          const preferredUser = currentProfile ?? remoteData.users.find((user) => user.role === initialRole) ?? remoteData.users[0];
          setData(remoteData);
          setActiveUserId(preferredUser.id);
          setActiveModule(defaultModuleForRole(preferredUser.role));
          setDataMode("supabase");
          setDataNotice(currentProfile ? "Signed in with Supabase Auth. Changes are saved to the live database." : "Connected to Supabase demo access. Changes are saved to the live database.");
          return;
        } catch (error) {
          if (!cancelled) {
            setDataNotice(`${error instanceof Error ? error.message : "Supabase load failed"}. Using local demo fallback.`);
          }
        }
      }

      const saved = window.localStorage.getItem(STORAGE_KEY);
      try {
        if (saved) setData(JSON.parse(saved) as AlignHqData);
      } catch {
        setData(seedData);
      }
      if (!cancelled) setDataMode("local");
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (dataMode === "supabase" && !data.users.some((user) => user.id === activeUserId)) {
      const user = data.users.find((item) => item.role === initialRole) ?? data.users[0];
      if (user) {
        setActiveUserId(user.id);
        setActiveModule(defaultModuleForRole(user.role));
      }
    }
  }, [activeUserId, data.users, dataMode, initialRole]);

  useEffect(() => {
    if (dataMode === "local") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, dataMode]);

  const activeUser = data.users.find((user) => user.id === activeUserId) ?? data.users.find((user) => user.role === initialRole) ?? seedData.users.find((user) => user.role === initialRole) ?? seedData.users[0];

  const handleUserChange = (userId: string) => {
    const user = data.users.find((item) => item.id === userId);
    if (!user) return;
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
    const log = {
      id: uid("audit"),
      actorId,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      reason,
      createdAt: nowIso()
    };
    setData((prev) => ({
      ...prev,
      auditLogs: [log, ...prev.auditLogs]
    }));
    if (dataMode === "supabase" && supabase) {
      void createAuditLog(supabase, log).catch((error) => setDataNotice(error.message));
    }
  };

  const patchGoal = (goalId: string, patch: Partial<Goal>, reason = "Goal field updated") => {
    const previous = data.goals.find((goal) => goal.id === goalId);
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => (goal.id === goalId ? { ...goal, ...patch } : goal))
    }));
    if (dataMode === "supabase" && supabase) {
      void saveGoalPatch(supabase, goalId, patch).catch((error) => setDataNotice(error.message));
    }
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
    if (dataMode === "supabase" && supabase) {
      void createGoal(supabase, goal).catch((error) => setDataNotice(error.message));
    }
    audit(activeUser.id, "Added goal", "goal_sheet", currentSheet.id, "-", goal.id, "Employee added draft goal");
  };

  const removeGoal = (goalId: string) => {
    setData((prev) => ({ ...prev, goals: prev.goals.filter((goal) => goal.id !== goalId) }));
    if (dataMode === "supabase" && supabase) {
      void deleteGoal(supabase, goalId).catch((error) => setDataNotice(error.message));
    }
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
    if (dataMode === "supabase" && supabase) {
      void saveSheetState(supabase, sheetId, state, returnedComment, state === "Locked" ? nowIso() : sheet.lockedAt).catch((error) => setDataNotice(error.message));
    }
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
    if (dataMode === "supabase" && supabase) {
      void saveSheetState(supabase, sheetId, "Returned", reason).catch((error) => setDataNotice(error.message));
    }
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
    const linkedGoals = data.goals.filter((item) => syncShared && item.sharedGoalId === goal.sharedGoalId);
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((item) => {
        if (item.id === goal.id || (syncShared && item.sharedGoalId === goal.sharedGoalId)) {
          return { ...item, updates: { ...item.updates, [quarter]: nextUpdate } };
        }
        return item;
      })
    }));
    if (dataMode === "supabase" && supabase) {
      void saveGoalUpdate(supabase, goal, quarter, nextUpdate, linkedGoals).catch((error) => setDataNotice(error.message));
    }
    audit(activeUser.id, "Submitted quarterly update", "goal", goal.id, JSON.stringify(goal.updates[quarter] ?? {}), JSON.stringify(nextUpdate), syncShared ? "Primary owner update synced to shared goal recipients" : "Quarterly actual updated");
  };

  const addManagerComment = (sheetId: string, goalId: string, comment: string) => {
    if (!comment.trim()) return;
    const newComment = {
      id: uid("comment"),
      sheetId,
      goalId,
      managerId: activeUser.id,
      quarter,
      comment,
      createdAt: nowIso()
    };
    setData((prev) => ({
      ...prev,
      managerComments: [newComment, ...prev.managerComments]
    }));
    if (dataMode === "supabase" && supabase) {
      void createManagerComment(supabase, newComment).catch((error) => setDataNotice(error.message));
    }
    audit(activeUser.id, "Added check-in comment", "goal", goalId, "-", comment, "Manager quarterly check-in");
  };

  const updateWindow = (windowId: string, patch: Partial<CycleWindow>) => {
    setData((prev) => ({
      ...prev,
      cycleWindows: prev.cycleWindows.map((window) => (window.id === windowId ? { ...window, ...patch } : window))
    }));
    if (dataMode === "supabase" && supabase) {
      void saveCycleWindowPatch(supabase, windowId, patch).catch((error) => setDataNotice(error.message));
    }
    audit(activeUser.id, "Updated cycle window", "cycle_window", windowId, "-", JSON.stringify(patch), "Admin configured cycle window");
  };

  const resetDemo = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    if (dataMode === "supabase" && supabase) {
      void loadAlignHqData(supabase)
        .then(setData)
        .catch((error) => setDataNotice(error.message));
    } else {
      setData(seedData);
    }
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
      <div className="accent-rail motion-enter mb-4 rounded-md border bg-white px-4 py-3 text-sm text-stone-600 shadow-sm" aria-live="polite">
        <span className="font-medium text-stone-900">{dataMode === "supabase" ? "Supabase mode" : dataMode === "local" ? "Local demo mode" : "Loading"}</span>
        <span className="ml-2">{dataNotice}</span>
      </div>
      <WorkflowPulse data={data} dataMode={dataMode} quarter={quarter} />
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
      {activeModule === "escalations" ? <EscalationCenter data={data} quarter={quarter} /> : null}
      {activeModule === "integrations" ? <IntegrationCenter data={data} /> : null}
      {activeModule === "reports" ? <ReportingConsole data={data} quarter={quarter} /> : null}
      {activeModule === "analytics" ? <AnalyticsDashboard data={data} quarter={quarter} /> : null}
    </DashboardShell>
  );
}
