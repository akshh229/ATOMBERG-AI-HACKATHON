import { Badge } from "@/components/ui/badge";
import type { GoalHealth } from "@/types/alignhq";

export function StateChip({ state }: { state: string }) {
  const variant = state.includes("Locked") || state.includes("Completed") || state === "Approved" ? "success" : state.includes("Submitted") || state.includes("Pending") ? "warning" : state.includes("Returned") || state.includes("Delayed") ? "danger" : "secondary";
  return <Badge variant={variant}>{state}</Badge>;
}

export function HealthChip({ health }: { health: GoalHealth }) {
  const variant = health === "Healthy" ? "success" : health === "Needs Attention" ? "warning" : health === "Delayed" || health === "Blocked" ? "danger" : "secondary";
  return <Badge variant={variant}>{health}</Badge>;
}
