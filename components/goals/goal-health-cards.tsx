"use client";

import type { Goal, Quarter } from "@/types/alignhq";
import { goalHealth, progressScore } from "@/lib/domain/rules";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HealthChip } from "@/components/dashboard/state-chip";

export function GoalHealthCards({ goals, quarter }: { goals: Goal[]; quarter: Quarter }) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">No goals yet</h2>
          <p className="mt-1 text-sm text-stone-600">Create goals in the workspace to see health cards.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {goals.map((goal) => {
        const score = progressScore(goal, quarter);
        const health = goalHealth(goal, quarter);
        return (
          <Card key={goal.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <HealthChip health={health} />
                <span className="tabular-nums text-lg font-semibold">{score}%</span>
              </div>
              <h2 className="mt-5 line-clamp-2 text-balance text-lg font-semibold">{goal.title || "Untitled goal"}</h2>
              <p className="mt-2 line-clamp-3 text-pretty text-sm text-stone-600">{goal.description || "Description pending."}</p>
              <Progress className="mt-5" value={score} />
              <p className="mt-3 text-xs text-stone-500">
                {quarter} status: {goal.updates[quarter]?.status ?? "Not Started"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
