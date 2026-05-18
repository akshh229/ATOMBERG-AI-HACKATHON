"use client";

import { useState } from "react";
import type { AlignHqData, Goal, GoalStatus, GoalUpdate, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser, goalHealth, progressScore } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HealthChip, StateChip } from "@/components/dashboard/state-chip";

export function EmployeeCheckInTracker({
  data,
  goals,
  quarter,
  onUpdate
}: {
  data: AlignHqData;
  goals: Goal[];
  quarter: Quarter;
  onUpdate: (goal: Goal, patch: Partial<GoalUpdate>) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>{quarter} achievement updates</CardTitle>
          <p className="mt-1 text-sm text-stone-600">Progress scores are tracking indicators, not ratings.</p>
        </div>
        <StateChip state={checkInState(goals, quarter)} />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Manager Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => {
                const update = goal.updates[quarter];
                const comments = data.managerComments.filter((comment) => comment.goalId === goal.id && comment.quarter === quarter);
                return (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div className="font-medium">{goal.title}</div>
                      <div className="mt-1 text-xs text-stone-500">{goal.thrustArea}</div>
                    </TableCell>
                    <TableCell>{goal.target}</TableCell>
                    <TableCell>
                      <Input type={goal.uomType === "Timeline" ? "date" : "text"} value={update?.actual ?? ""} onChange={(event) => onUpdate(goal, { actual: event.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Select value={update?.status ?? "On Track"} onChange={(event) => onUpdate(goal, { status: event.target.value as GoalStatus })}>
                        <option>Not Started</option>
                        <option>On Track</option>
                        <option>Completed</option>
                      </Select>
                      <label className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                        <input type="checkbox" checked={Boolean(update?.blocked)} onChange={(event) => onUpdate(goal, { blocked: event.target.checked })} />
                        Blocked
                      </label>
                    </TableCell>
                    <TableCell><HealthChip health={goalHealth(goal, quarter)} /></TableCell>
                    <TableCell className="tabular-nums">{progressScore(goal, quarter)}%</TableCell>
                    <TableCell className="max-w-xs text-sm text-stone-600">{comments[0]?.comment ?? "No manager comment yet."}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ManagerCheckInTracker({
  data,
  teamSheets,
  quarter,
  onAddComment
}: {
  data: AlignHqData;
  teamSheets: { id: string; employeeId: string; state: string }[];
  quarter: Quarter;
  onAddComment: (sheetId: string, goalId: string, comment: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-4">
      {teamSheets.map((sheet) => {
        const employee = getUser(data, sheet.employeeId);
        const goals = getSheetGoals(data, sheet.id);
        return (
          <Card key={sheet.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle>{employee.name}</CardTitle>
                <p className="mt-1 text-sm text-stone-600">{checkInState(goals, quarter)}</p>
              </div>
              <StateChip state={sheet.state} />
            </CardHeader>
            <CardContent className="grid gap-3">
              {goals.map((goal) => (
                <div key={goal.id} className="grid gap-3 rounded-lg border bg-white p-3 xl:grid-cols-[minmax(240px,1fr)_120px_minmax(260px,1fr)_auto] xl:items-center">
                  <div>
                    <div className="font-medium">{goal.title}</div>
                    <div className="mt-1 text-xs text-stone-500">
                      Target {goal.target} - Actual {goal.updates[quarter]?.actual ?? "Pending"} - Score {progressScore(goal, quarter)}%
                    </div>
                  </div>
                  <HealthChip health={goalHealth(goal, quarter)} />
                  <Textarea placeholder="Structured check-in comment" value={drafts[goal.id] ?? ""} onChange={(event) => setDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))} />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      onAddComment(sheet.id, goal.id, drafts[goal.id] ?? "");
                      setDrafts((prev) => ({ ...prev, [goal.id]: "" }));
                    }}
                  >
                    Add comment
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
