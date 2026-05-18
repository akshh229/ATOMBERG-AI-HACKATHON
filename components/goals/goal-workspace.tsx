"use client";

import { AlertTriangle, Lock } from "lucide-react";
import type { AlignHqData, AppUser, Goal, GoalSheet, ProgressDirection, UomType } from "@/types/alignhq";
import { canEditSheet, getUser, thrustAreas, validateGoalSheet } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { StateChip } from "@/components/dashboard/state-chip";

export function GoalWorkspace({
  data,
  activeUser,
  sheet,
  goals,
  onPatchGoal,
  onAddGoal,
  onRemoveGoal,
  onSubmit
}: {
  data: AlignHqData;
  activeUser: AppUser;
  sheet: GoalSheet;
  goals: Goal[];
  onPatchGoal: (goalId: string, patch: Partial<Goal>, reason?: string) => void;
  onAddGoal: () => void;
  onRemoveGoal: (goalId: string) => void;
  onSubmit: () => void;
}) {
  const validation = validateGoalSheet(goals);
  const editable = activeUser.role === "Employee" && activeUser.id === sheet.employeeId && canEditSheet(sheet);
  const employee = getUser(data, sheet.employeeId);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{employee.name}</CardTitle>
            <p className="mt-1 text-sm text-stone-600">{sheet.cycle} goal sheet</p>
          </div>
          <StateChip state={sheet.state} />
        </CardHeader>
        <CardContent>
          {sheet.returnedComment ? (
            <div className="mb-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {sheet.returnedComment}
            </div>
          ) : null}

          <div className="mb-4 rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="tabular-nums text-2xl font-semibold">{validation.totalWeightage}%</div>
                <p className="text-sm text-stone-600">Total weightage</p>
              </div>
              <StateChip state={validation.valid ? "Ready" : "Validation Required"} />
            </div>
            <Progress value={validation.totalWeightage} />
            {!validation.valid ? <p className="mt-2 text-sm text-red-700">{validation.errors[0]}</p> : null}
          </div>

          <div className="grid gap-3">
            {goals.map((goal) => {
              const sharedReadOnly = Boolean(goal.sharedGoalId && goal.primaryOwnerId !== sheet.employeeId);
              return (
                <article key={goal.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Select disabled={!editable || sharedReadOnly} className="max-w-xs" value={goal.thrustArea} onChange={(event) => onPatchGoal(goal.id, { thrustArea: event.target.value })}>
                      {thrustAreas.map((area) => (
                        <option key={area}>{area}</option>
                      ))}
                    </Select>
                    {goal.sharedGoalId ? <StateChip state="Shared KPI" /> : null}
                  </div>
                  <div className="grid gap-3">
                    <Input disabled={!editable || sharedReadOnly} value={goal.title} placeholder="Goal title" onChange={(event) => onPatchGoal(goal.id, { title: event.target.value })} />
                    <Textarea disabled={!editable || sharedReadOnly} value={goal.description} placeholder="Description" onChange={(event) => onPatchGoal(goal.id, { description: event.target.value })} />
                    <div className="grid gap-3 md:grid-cols-[1fr_110px_1fr_110px]">
                      <Select disabled={!editable || sharedReadOnly} value={goal.uomType} onChange={(event) => onPatchGoal(goal.id, { uomType: event.target.value as UomType })}>
                        <option>Numeric</option>
                        <option>Percentage</option>
                        <option>Timeline</option>
                        <option>Zero-based</option>
                      </Select>
                      <Select disabled={!editable || sharedReadOnly || goal.uomType === "Timeline" || goal.uomType === "Zero-based"} value={goal.progressDirection} onChange={(event) => onPatchGoal(goal.id, { progressDirection: event.target.value as ProgressDirection })}>
                        <option>Min</option>
                        <option>Max</option>
                      </Select>
                      <Input disabled={!editable || sharedReadOnly} type={goal.uomType === "Timeline" ? "date" : "text"} value={goal.target} placeholder="Target" onChange={(event) => onPatchGoal(goal.id, { target: event.target.value })} />
                      <Input disabled={!editable} type="number" min={10} value={goal.weightage} onChange={(event) => onPatchGoal(goal.id, { weightage: Number(event.target.value) })} />
                    </div>
                  </div>
                  {editable && !goal.sharedGoalId ? (
                    <Button className="mt-3" size="sm" variant="ghost" onClick={() => onRemoveGoal(goal.id)}>
                      Remove goal
                    </Button>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={!editable || goals.length >= 8} onClick={onAddGoal}>
              Add goal
            </Button>
            <Button disabled={!editable || !validation.valid} onClick={onSubmit}>
              Submit for approval
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Rule passed={validation.totalWeightage === 100}>Total weightage equals 100%.</Rule>
          <Rule passed={goals.every((goal) => goal.weightage >= 10)}>Each goal has at least 10% weightage.</Rule>
          <Rule passed={goals.length <= 8}>Maximum 8 goals per employee.</Rule>
          <Rule passed={sheet.state !== "Locked"} icon={sheet.state === "Locked" ? Lock : undefined}>Locked sheets need Admin intervention.</Rule>
        </CardContent>
      </Card>
    </div>
  );
}

function Rule({ passed, children, icon: Icon }: { passed: boolean; children: React.ReactNode; icon?: typeof Lock }) {
  return (
    <div className={passed ? "text-emerald-800" : "text-stone-600"}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
        <span>{children}</span>
      </div>
    </div>
  );
}
