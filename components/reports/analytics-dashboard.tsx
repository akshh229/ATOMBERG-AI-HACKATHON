"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AlignHqData, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser, goalHealth, progressScore, quarters } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AnalyticsDashboard({ data, quarter }: { data: AlignHqData; quarter: Quarter }) {
  const trend = quarters.map((item) => ({
    quarter: item,
    score: Math.round(data.goals.reduce((sum, goal) => sum + progressScore(goal, item), 0) / Math.max(data.goals.length, 1))
  }));

  const departments = Object.values(
    data.goalSheets.reduce<Record<string, { department: string; completed: number; total: number }>>((acc, sheet) => {
      const user = getUser(data, sheet.employeeId);
      acc[user.department] ??= { department: user.department, completed: 0, total: 0 };
      acc[user.department].total += 1;
      if (checkInState(getSheetGoals(data, sheet.id), quarter) === "Check-in Completed") acc[user.department].completed += 1;
      return acc;
    }, {})
  );

  const thrustDistribution = Object.values(
    data.goals.reduce<Record<string, { name: string; value: number }>>((acc, goal) => {
      acc[goal.thrustArea] ??= { name: goal.thrustArea, value: 0 };
      acc[goal.thrustArea].value += 1;
      return acc;
    }, {})
  );

  const uomDistribution = Object.values(
    data.goals.reduce<Record<string, { name: string; value: number }>>((acc, goal) => {
      acc[goal.uomType] ??= { name: goal.uomType, value: 0 };
      acc[goal.uomType].value += 1;
      return acc;
    }, {})
  );

  const managerEffectiveness = data.users
    .filter((user) => user.role === "Manager")
    .map((manager) => {
      const reports = data.users.filter((user) => user.managerId === manager.id);
      const sheets = data.goalSheets.filter((sheet) => reports.some((report) => report.id === sheet.employeeId));
      const locked = sheets.filter((sheet) => sheet.state === "Locked" || sheet.state === "Approved").length;
      const completed = sheets.filter((sheet) => checkInState(getSheetGoals(data, sheet.id), quarter) === "Check-in Completed").length;
      return {
        manager: manager.name,
        reports: reports.length,
        approvalRate: Math.round((locked / Math.max(sheets.length, 1)) * 100),
        checkInRate: Math.round((completed / Math.max(sheets.length, 1)) * 100)
      };
    });

  const heatmap = data.users
    .filter((user) => user.role === "Employee")
    .map((employee) => {
      const sheet = data.goalSheets.find((item) => item.employeeId === employee.id);
      const goals = sheet ? getSheetGoals(data, sheet.id) : [];
      return {
        employee: employee.name,
        department: employee.department,
        values: quarters.map((item) => Math.round(goals.reduce((sum, goal) => sum + progressScore(goal, item), 0) / Math.max(goals.length, 1)))
      };
    });

  const statusDistribution = Object.values(
    data.goals.reduce<Record<string, { name: string; value: number }>>((acc, goal) => {
      const health = goalHealth(goal, quarter);
      acc[health] ??= { name: health, value: 0 };
      acc[health].value += 1;
      return acc;
    }, {})
  );

  const colors = ["#0f766e", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#475569"];

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>QoQ achievement trend</CardTitle>
          <p className="text-sm text-stone-600">Weighted progress movement across quarterly check-ins.</p>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd8ce" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completion heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {heatmap.map((row) => (
              <div key={row.employee} className="grid grid-cols-[130px_repeat(4,1fr)] items-center gap-2 text-sm">
                <div>
                  <div className="font-medium">{row.employee}</div>
                  <div className="text-xs text-stone-500">{row.department}</div>
                </div>
                {row.values.map((value, index) => (
                  <div key={`${row.employee}-${quarters[index]}`} className="rounded-md px-2 py-3 text-center font-medium text-white" style={{ backgroundColor: value >= 80 ? "#0f766e" : value >= 55 ? "#d97706" : "#dc2626", opacity: Math.max(0.35, value / 100) }}>
                    {quarters[index]} {value}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <DistributionCard title="Goal distribution by thrust area" data={thrustDistribution} colors={colors} />
        <DistributionCard title="Goal distribution by UoM" data={uomDistribution} colors={colors} />
        <DistributionCard title={`Goal status in ${quarter}`} data={statusDistribution} colors={colors} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Department completion</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd8ce" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {departments.map((department) => (
                    <Cell key={department.department} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manager effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Check-ins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managerEffectiveness.map((manager) => (
                  <TableRow key={manager.manager}>
                    <TableCell className="font-medium">{manager.manager}</TableCell>
                    <TableCell>{manager.reports}</TableCell>
                    <TableCell><Badge variant={manager.approvalRate >= 75 ? "success" : "warning"}>{manager.approvalRate}%</Badge></TableCell>
                    <TableCell><Badge variant={manager.checkInRate >= 75 ? "success" : "warning"}>{manager.checkInRate}%</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DistributionCard({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={90} paddingAngle={2}>
              {data.map((item, index) => (
                <Cell key={item.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
