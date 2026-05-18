"use client";

import type { AlignHqData, AppUser, Goal } from "@/types/alignhq";
import { getUser } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StateChip } from "@/components/dashboard/state-chip";

export function SharedKpiManager({
  data,
  activeUser,
  onPatchGoal
}: {
  data: AlignHqData;
  activeUser: AppUser;
  onPatchGoal: (goalId: string, patch: Partial<Goal>, reason?: string) => void;
}) {
  const sharedGoals = data.goals.filter((goal) => goal.sharedGoalId);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Shared departmental KPIs</CardTitle>
          <p className="mt-1 text-sm text-stone-600">Recipients can edit weightage only. Primary owner achievement updates sync across linked sheets.</p>
        </div>
        <StateChip state="Stretch Included" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Q1 Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sharedGoals.map((goal) => {
                const recipient = getUser(data, goal.employeeId);
                const owner = goal.primaryOwnerId ? getUser(data, goal.primaryOwnerId) : recipient;
                const canEditWeight = activeUser.role === "Admin" || activeUser.id === recipient.id || activeUser.id === recipient.managerId;
                return (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div className="font-medium">{goal.title}</div>
                      <div className="mt-1 text-xs text-stone-500">{goal.sharedGoalId}</div>
                    </TableCell>
                    <TableCell>{owner.name}</TableCell>
                    <TableCell>{recipient.name}</TableCell>
                    <TableCell>{goal.target}</TableCell>
                    <TableCell>
                      <Input disabled={!canEditWeight} type="number" value={goal.weightage} onChange={(event) => onPatchGoal(goal.id, { weightage: Number(event.target.value) }, "Shared KPI recipient weightage edited")} />
                    </TableCell>
                    <TableCell>{goal.updates.Q1?.actual ?? "Pending"}</TableCell>
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
