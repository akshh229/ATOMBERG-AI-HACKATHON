"use client";

import type { AlignHqData, GoalSheet, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StateChip } from "@/components/dashboard/state-chip";

export function TeamActions({ data, teamSheets, quarter }: { data: AlignHqData; teamSheets: GoalSheet[]; quarter: Quarter }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending team actions</CardTitle>
        <p className="text-sm text-stone-600">Approval and check-in work that still needs manager attention.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>{quarter} Check-in</TableHead>
                <TableHead>Next Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamSheets.map((sheet) => {
                const employee = getUser(data, sheet.employeeId);
                const checkin = checkInState(getSheetGoals(data, sheet.id), quarter);
                return (
                  <TableRow key={sheet.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell><StateChip state={sheet.state} /></TableCell>
                    <TableCell><StateChip state={checkin} /></TableCell>
                    <TableCell>{sheet.state === "Submitted" ? "Review goals" : checkin === "Check-in Pending" ? "Follow up on update" : "No action"}</TableCell>
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
