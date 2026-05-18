"use server";

import type { Goal } from "@/types/alignhq";
import { validateGoalSheet } from "@/lib/domain/rules";

export async function validateGoalSheetAction(goals: Goal[]) {
  return validateGoalSheet(goals);
}
