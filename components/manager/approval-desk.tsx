"use client";

import { useState } from "react";
import type { AlignHqData, Goal, GoalSheet } from "@/types/alignhq";
import { getSheetGoals, getUser, validateGoalSheet } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StateChip } from "@/components/dashboard/state-chip";

export function ApprovalDesk({
  data,
  teamSheets,
  onPatchGoal,
  onApprove,
  onReturn
}: {
  data: AlignHqData;
  teamSheets: GoalSheet[];
  onPatchGoal: (goalId: string, patch: Partial<Goal>, reason?: string) => void;
  onApprove: (sheetId: string) => void;
  onReturn: (sheetId: string, comment: string) => void;
}) {
  const [returnComments, setReturnComments] = useState<Record<string, string>>({});

  if (teamSheets.length === 0) {
    return <EmptyPanel title="No direct reports" text="Choose a manager with direct reports to review submissions." />;
  }

  return (
    <div className="grid gap-4">
      {teamSheets.map((sheet) => {
        const employee = getUser(data, sheet.employeeId);
        const goals = getSheetGoals(data, sheet.id);
        const validation = validateGoalSheet(goals);
        const editable = sheet.state === "Submitted";

        return (
          <Card key={sheet.id}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{employee.name}</CardTitle>
                <p className="mt-1 text-sm text-stone-600">
                  {employee.department} - {validation.totalWeightage}% total weightage
                </p>
              </div>
              <StateChip state={sheet.state} />
            </CardHeader>
            <CardContent>
              {!validation.valid ? <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{validation.errors.join(" ")}</p> : null}
              <div className="overflow-x-auto">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>UoM</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Weightage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell>
                          <div className="font-medium">{goal.title}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-stone-500">{goal.description}</div>
                        </TableCell>
                        <TableCell>{goal.uomType}</TableCell>
                        <TableCell>
                          <Input disabled={!editable} value={goal.target} onChange={(event) => onPatchGoal(goal.id, { target: event.target.value }, "Manager edited target before approval")} />
                        </TableCell>
                        <TableCell>
                          <Input disabled={!editable} type="number" value={goal.weightage} onChange={(event) => onPatchGoal(goal.id, { weightage: Number(event.target.value) }, "Manager edited weightage before approval")} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {editable ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                  <Textarea
                    value={returnComments[sheet.id] ?? "Please refine targets and resubmit."}
                    onChange={(event) => setReturnComments((prev) => ({ ...prev, [sheet.id]: event.target.value }))}
                  />
                  <Button variant="secondary" onClick={() => onReturn(sheet.id, returnComments[sheet.id] ?? "Please refine targets and resubmit.")}>
                    Return
                  </Button>
                  <Button disabled={!validation.valid} onClick={() => onApprove(sheet.id)}>
                    Approve and lock
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{text}</p>
      </CardContent>
    </Card>
  );
}
