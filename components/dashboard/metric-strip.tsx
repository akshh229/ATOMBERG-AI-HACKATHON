import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricStrip({ metrics }: { metrics: { label: string; value: string; icon: LucideIcon; tone?: string }[] }) {
  return (
    <section className="mb-5 grid gap-3 md:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="accent-rail">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="motion-pop flex size-10 items-center justify-center rounded-lg bg-teal-50 text-[hsl(var(--primary))]">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500">{metric.label}</p>
                <div className="tabular-nums text-xl font-semibold text-stone-950">{metric.value}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
