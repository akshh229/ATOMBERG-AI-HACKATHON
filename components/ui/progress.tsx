import { cn } from "@/lib/utils/cn";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-stone-200", className)}>
      <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
