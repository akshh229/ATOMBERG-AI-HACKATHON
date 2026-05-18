import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoRoleLauncher } from "@/components/auth/demo-role-launcher";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[hsl(var(--background))] p-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="motion-enter flex flex-col justify-center">
            <div className="mb-6 flex size-11 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white shadow-md">
              <Building2 className="size-5" />
            </div>
            <Badge className="w-fit">FY26 demo workspace</Badge>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-tight text-stone-950">
              AlignHQ goal operations portal
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-6 text-stone-600">
              A focused internal workflow for goal setting, manager approval, quarterly achievement tracking, and HR governance.
            </p>
            <div className="floating-bars mt-8" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {["Employee", "Manager", "Admin"].map((role) => (
                <div key={role} className="rounded-lg border bg-white px-3 py-3 text-sm font-medium text-stone-700 shadow-sm">
                  {role}
                </div>
              ))}
            </div>
          </div>

          <DemoRoleLauncher />
        </div>
      </section>
    </main>
  );
}
