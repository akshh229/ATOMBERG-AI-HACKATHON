import { expect, test } from "@playwright/test";
import { seedData } from "../../lib/demo/seed-data";
import { buildEscalationItems } from "../../lib/domain/escalations";
import { progressScoreFromUpdate, validateGoalSheet } from "../../lib/domain/rules";

test("validateGoalSheet rejects invalid total and low-weight goals", () => {
  const goals = seedData.goals
    .filter((goal) => goal.sheetId === "sheet-asha")
    .map((goal) => ({ ...goal, weightage: goal.id === "goal-a1" ? 5 : goal.weightage }));

  const result = validateGoalSheet(goals);

  expect(result.valid).toBeFalsy();
  expect(result.errors).toContain("Minimum weightage per goal is 10%.");
  expect(result.errors.some((item) => item.includes("Total weightage must equal 100%"))).toBeTruthy();
});

test("progressScoreFromUpdate applies timeline penalty", () => {
  const goal = {
    ...seedData.goals.find((item) => item.uomType === "Timeline")!,
    target: "2026-01-01"
  };

  const score = progressScoreFromUpdate(goal, {
    quarter: "Q1",
    actual: "2026-01-11",
    status: "On Track",
    blocked: false,
    submittedAt: new Date().toISOString()
  });

  expect(score).toBe(50);
});

test("buildEscalationItems creates reminder/escalated entries near or past due windows", () => {
  const now = new Date("2027-01-20T00:00:00.000Z");
  const items = buildEscalationItems(seedData, "Q1", now);

  expect(items.length).toBeGreaterThan(0);
  expect(items.some((item) => item.kind === "Manager approval")).toBeTruthy();
  expect(items.some((item) => item.severity === "Escalated")).toBeTruthy();
});
