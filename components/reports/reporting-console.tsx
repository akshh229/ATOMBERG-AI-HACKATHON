"use client";

import { History } from "lucide-react";
import type { AlignHqData, Quarter } from "@/types/alignhq";
import { createAchievementCsv, formatDate, getSheetGoals, getUser, goalHealth, progressScore } from "@/lib/domain/rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HealthChip } from "@/components/dashboard/state-chip";

export function ReportingConsole({ data, quarter }: { data: AlignHqData; quarter: Quarter }) {
  const download = () => {
    const blob = new Blob([createAchievementCsv(data, quarter)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alignhq-achievement-${quarter.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Achievement report</CardTitle>
            <p className="mt-1 text-sm text-stone-600">Exportable planned vs actual view for governance.</p>
          </div>
          <Button onClick={download}>Export CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.goalSheets.flatMap((sheet) => {
                  const employee = getUser(data, sheet.employeeId);
                  return getSheetGoals(data, sheet.id).map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>
                        <div className="font-medium">{goal.title}</div>
                        <div className="mt-1 text-xs text-stone-500">{goal.thrustArea}</div>
                      </TableCell>
                      <TableCell>{goal.weightage}%</TableCell>
                      <TableCell>{goal.updates[quarter]?.actual ?? "Pending"}</TableCell>
                      <TableCell className="tabular-nums">{progressScore(goal, quarter)}%</TableCell>
                      <TableCell><HealthChip health={goalHealth(goal, quarter)} /></TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit trail</CardTitle>
          <p className="text-sm text-stone-600">Traceable history for approvals, unlocks, edits, and exports.</p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.auditLogs.slice(0, 10).map((log) => (
            <article key={log.id} className="grid grid-cols-[20px_1fr] gap-3 border-b pb-3 last:border-0">
              <History className="mt-1 size-4 text-[hsl(var(--primary))]" />
              <div>
                <div className="font-medium">{log.action}</div>
                <div className="mt-1 text-xs text-stone-500">
                  {getUser(data, log.actorId).name} - {formatDate(log.createdAt)}
                </div>
                <p className="mt-1 text-sm text-stone-600">{log.reason}</p>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
