"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AlignHqData, Quarter } from "@/types/alignhq";
import { checkInState, getSheetGoals, getUser, progressScore, quarters } from "@/lib/domain/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>QoQ progress trend</CardTitle>
          <p className="text-sm text-stone-600">Optional analytics for demo depth.</p>
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
          <CardTitle>Completion by department</CardTitle>
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
    </div>
  );
}
