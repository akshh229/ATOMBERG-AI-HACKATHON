"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { progressScoreFromUpdate } from "@/lib/domain/rules";
import type {
  AlignHqData,
  AppUser,
  AuditLog,
  CycleWindow,
  Goal,
  GoalSheet,
  GoalSheetState,
  GoalUpdate,
  ManagerComment,
  Quarter,
  SharedGoal
} from "@/types/alignhq";

type Client = SupabaseClient;
type AnyRow = Record<string, any>;

export function getAlignHqSupabaseClient() {
  return createSupabaseBrowserClient();
}

function raise(context: string, error: unknown): never {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "Unknown Supabase error";
  throw new Error(`${context}: ${message}`);
}

export async function loadAlignHqData(client: Client): Promise<AlignHqData> {
  const [usersResult, sheetsResult, sharedGoalsResult, goalsResult, updatesResult, commentsResult, windowsResult, auditsResult] = await Promise.all([
    client.from("users").select("*").order("name"),
    client.from("goal_sheets").select("*").order("created_at"),
    client.from("shared_goals").select("*").order("created_at"),
    client.from("goals").select("*").order("created_at"),
    client.from("goal_updates").select("*").order("submitted_at"),
    client.from("manager_comments").select("*").order("created_at", { ascending: false }),
    client.from("cycle_windows").select("*").order("starts_at"),
    client.from("audit_logs").select("*").order("created_at", { ascending: false })
  ]);

  if (usersResult.error) raise("Load users failed", usersResult.error);
  if (sheetsResult.error) raise("Load goal sheets failed", sheetsResult.error);
  if (sharedGoalsResult.error) raise("Load shared goals failed", sharedGoalsResult.error);
  if (goalsResult.error) raise("Load goals failed", goalsResult.error);
  if (updatesResult.error) raise("Load goal updates failed", updatesResult.error);
  if (commentsResult.error) raise("Load manager comments failed", commentsResult.error);
  if (windowsResult.error) raise("Load cycle windows failed", windowsResult.error);
  if (auditsResult.error) raise("Load audit logs failed", auditsResult.error);

  const sharedGoals = (sharedGoalsResult.data ?? []).map(mapSharedGoal);
  const updatesByGoal = new Map<string, Goal["updates"]>();

  (updatesResult.data ?? []).forEach((row: AnyRow) => {
    const updates = updatesByGoal.get(row.goal_id) ?? {};
    updates[row.quarter as Quarter] = mapGoalUpdate(row);
    updatesByGoal.set(row.goal_id, updates);
  });

  return {
    users: (usersResult.data ?? []).map(mapUser),
    goalSheets: (sheetsResult.data ?? []).map(mapGoalSheet),
    sharedGoals,
    goals: (goalsResult.data ?? []).map((row: AnyRow) => mapGoal(row, sharedGoals, updatesByGoal.get(row.id) ?? {})),
    managerComments: (commentsResult.data ?? []).map(mapManagerComment),
    cycleWindows: (windowsResult.data ?? []).map(mapCycleWindow),
    auditLogs: (auditsResult.data ?? []).map(mapAuditLog)
  };
}

export async function saveGoalPatch(client: Client, goalId: string, patch: Partial<Goal>) {
  const dbPatch: AnyRow = {};
  if (patch.thrustArea !== undefined) dbPatch.thrust_area = patch.thrustArea;
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.uomType !== undefined) dbPatch.uom_type = patch.uomType;
  if (patch.progressDirection !== undefined) dbPatch.progress_direction = patch.progressDirection;
  if (patch.target !== undefined) dbPatch.target = patch.target;
  if (patch.weightage !== undefined) dbPatch.weightage = patch.weightage;
  if (patch.locked !== undefined) dbPatch.locked = patch.locked;

  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await client.from("goals").update(dbPatch).eq("id", goalId);
  if (error) raise("Update goal failed", error);
}

export async function createGoal(client: Client, goal: Goal) {
  const { error } = await client.from("goals").insert({
    id: goal.id,
    sheet_id: goal.sheetId,
    employee_id: goal.employeeId,
    shared_goal_id: goal.sharedGoalId ?? null,
    thrust_area: goal.thrustArea,
    title: goal.title,
    description: goal.description,
    uom_type: goal.uomType,
    progress_direction: goal.progressDirection,
    target: goal.target,
    weightage: goal.weightage,
    locked: goal.locked
  });
  if (error) raise("Create goal failed", error);
}

export async function deleteGoal(client: Client, goalId: string) {
  const { error } = await client.from("goals").delete().eq("id", goalId);
  if (error) raise("Delete goal failed", error);
}

export async function saveSheetState(client: Client, sheetId: string, state: GoalSheetState, returnedComment?: string, lockedAt?: string) {
  const { error } = await client
    .from("goal_sheets")
    .update({
      state,
      returned_comment: returnedComment ?? null,
      locked_at: lockedAt ?? null
    })
    .eq("id", sheetId);
  if (error) raise("Update goal sheet failed", error);
}

export async function saveGoalUpdate(client: Client, goal: Goal, quarter: Quarter, update: GoalUpdate, linkedGoals: Goal[]) {
  const rows = linkedGoals.map((linkedGoal) => ({
    goal_id: linkedGoal.id,
    employee_id: linkedGoal.employeeId,
    quarter,
    actual: update.actual,
    status: update.status,
    blocked: update.blocked,
    progress_score: progressScoreFromUpdate(linkedGoal, update),
    submitted_at: update.submittedAt
  }));

  if (!rows.some((row) => row.goal_id === goal.id)) {
    rows.push({
      goal_id: goal.id,
      employee_id: goal.employeeId,
      quarter,
      actual: update.actual,
      status: update.status,
      blocked: update.blocked,
      progress_score: progressScoreFromUpdate(goal, update),
      submitted_at: update.submittedAt
    });
  }

  const { error } = await client.from("goal_updates").upsert(rows, { onConflict: "goal_id,quarter" });
  if (error) raise("Save quarterly update failed", error);
}

export async function createManagerComment(client: Client, comment: ManagerComment) {
  const { error } = await client.from("manager_comments").insert({
    id: comment.id,
    sheet_id: comment.sheetId,
    goal_id: comment.goalId,
    manager_id: comment.managerId,
    quarter: comment.quarter,
    comment: comment.comment,
    created_at: comment.createdAt
  });
  if (error) raise("Create manager comment failed", error);
}

export async function saveCycleWindowPatch(client: Client, windowId: string, patch: Partial<CycleWindow>) {
  const dbPatch: AnyRow = {};
  if (patch.label !== undefined) dbPatch.label = patch.label;
  if (patch.quarter !== undefined) dbPatch.quarter = patch.quarter;
  if (patch.startsAt !== undefined) dbPatch.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) dbPatch.ends_at = patch.endsAt;
  if (patch.active !== undefined) dbPatch.active = patch.active;

  const { error } = await client.from("cycle_windows").update(dbPatch).eq("id", windowId);
  if (error) raise("Update cycle window failed", error);
}

export async function createAuditLog(client: Client, log: AuditLog) {
  const { error } = await client.from("audit_logs").insert({
    id: log.id,
    actor_id: log.actorId,
    action: log.action,
    entity_type: log.entityType,
    entity_id: isUuid(log.entityId) ? log.entityId : null,
    previous_value: toJson(log.previousValue),
    new_value: toJson(log.newValue),
    reason: log.reason,
    created_at: log.createdAt
  });
  if (error) raise("Create audit log failed", error);
}

function mapUser(row: AnyRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    title: row.title,
    department: row.department,
    managerId: row.manager_id ?? undefined
  };
}

function mapGoalSheet(row: AnyRow): GoalSheet {
  return {
    id: row.id,
    employeeId: row.employee_id,
    cycle: row.cycle,
    state: row.state,
    returnedComment: row.returned_comment ?? undefined,
    lockedAt: row.locked_at ?? undefined
  };
}

function mapSharedGoal(row: AnyRow): SharedGoal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thrustArea: row.thrust_area,
    target: row.target,
    uomType: row.uom_type,
    progressDirection: row.progress_direction,
    primaryOwnerId: row.primary_owner_id
  };
}

function mapGoal(row: AnyRow, sharedGoals: SharedGoal[], updates: Goal["updates"]): Goal {
  const sharedGoal = sharedGoals.find((item) => item.id === row.shared_goal_id);
  return {
    id: row.id,
    sheetId: row.sheet_id,
    employeeId: row.employee_id,
    thrustArea: row.thrust_area,
    title: row.title,
    description: row.description,
    uomType: row.uom_type,
    progressDirection: row.progress_direction,
    target: row.target,
    weightage: Number(row.weightage),
    locked: Boolean(row.locked),
    sharedGoalId: row.shared_goal_id ?? undefined,
    primaryOwnerId: sharedGoal?.primaryOwnerId,
    updates
  };
}

function mapGoalUpdate(row: AnyRow): GoalUpdate {
  return {
    quarter: row.quarter,
    actual: row.actual,
    status: row.status,
    blocked: Boolean(row.blocked),
    submittedAt: row.submitted_at
  };
}

function mapManagerComment(row: AnyRow): ManagerComment {
  return {
    id: row.id,
    sheetId: row.sheet_id,
    goalId: row.goal_id,
    managerId: row.manager_id,
    quarter: row.quarter,
    comment: row.comment,
    createdAt: row.created_at
  };
}

function mapCycleWindow(row: AnyRow): CycleWindow {
  return {
    id: row.id,
    label: row.label,
    quarter: row.quarter ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: Boolean(row.active)
  };
}

function mapAuditLog(row: AnyRow): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? "",
    previousValue: JSON.stringify(row.previous_value ?? ""),
    newValue: JSON.stringify(row.new_value ?? ""),
    reason: row.reason,
    createdAt: row.created_at
  };
}

function toJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
