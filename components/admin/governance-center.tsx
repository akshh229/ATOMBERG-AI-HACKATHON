"use client";

import { useState } from "react";
import { Unlock } from "lucide-react";
import type { AlignHqData, CycleWindow, GoalSheet, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser } from "@/lib/domain/rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StateChip } from "@/components/dashboard/state-chip";

export function GovernanceCenter({
  data,
  quarter,
  onUnlock,
  onUpdateWindow
}: {
  data: AlignHqData;
  quarter: Quarter;
  onUnlock: (sheetId: string, reason: string) => void;
  onUpdateWindow: (windowId: string, patch: Partial<CycleWindow>) => void;
}) {
  const [unlockTarget, setUnlockTarget] = useState<GoalSheet | null>(null);
  const [reason, setReason] = useState("Correction requested after approval.");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Completion dashboard</CardTitle>
          <p className="text-sm text-stone-600">Organization-wide completion, approvals, and exception handling.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Goal State</TableHead>
                  <TableHead>{quarter} State</TableHead>
                  <TableHead>Exception</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.goalSheets.map((sheet) => {
                  const employee = getUser(data, sheet.employeeId);
                  const manager = employee.managerId ? getUser(data, employee.managerId) : undefined;
                  return (
                    <TableRow key={sheet.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{manager?.name ?? "-"}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell><StateChip state={sheet.state} /></TableCell>
                      <TableCell><StateChip state={checkInState(getSheetGoals(data, sheet.id), quarter)} /></TableCell>
                      <TableCell>
                        {sheet.state === "Locked" || sheet.state === "Approved" ? (
                          <Button size="sm" variant="secondary" onClick={() => setUnlockTarget(sheet)}>
                            <Unlock className="size-4" />
                            Unlock
                          </Button>
                        ) : (
                          <span className="text-sm text-stone-500">No lock</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cycle windows</CardTitle>
          <p className="text-sm text-stone-600">Seeded quarterly windows for the FY26 demo cycle.</p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.cycleWindows.map((window) => (
            <div key={window.id} className="grid gap-2 rounded-lg border bg-white p-3">
              <div className="font-medium">{window.label}</div>
              <Input type="date" value={window.startsAt} onChange={(event) => onUpdateWindow(window.id, { startsAt: event.target.value })} />
              <Input type="date" value={window.endsAt} onChange={(event) => onUpdateWindow(window.id, { endsAt: event.target.value })} />
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" checked={window.active} onChange={(event) => onUpdateWindow(window.id, { active: event.target.checked })} />
                Active
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(unlockTarget)} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock approved goals</DialogTitle>
            <DialogDescription>Admin unlocks require a reason and are written to the audit trail.</DialogDescription>
          </DialogHeader>
          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for unlock" />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUnlockTarget(null)}>Cancel</Button>
            <Button
              disabled={!reason.trim() || !unlockTarget}
              onClick={() => {
                if (!unlockTarget) return;
                onUnlock(unlockTarget.id, reason);
                setUnlockTarget(null);
              }}
            >
              Unlock with audit log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
