"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[hsl(var(--background))] p-6">
      <section className="max-w-md rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-balance text-xl font-semibold">Something interrupted the dashboard.</h1>
        <p className="mt-2 text-pretty text-sm text-stone-600">Reset the view and the seeded demo state will reload cleanly.</p>
        <Button className="mt-5" onClick={reset}>Reset dashboard</Button>
      </section>
    </main>
  );
}
