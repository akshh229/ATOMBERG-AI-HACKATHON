import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roles = [
  { href: "/employee", label: "Employee", name: "Asha Menon", note: "Create goals and submit Q1 updates" },
  { href: "/manager", label: "Manager", name: "Isha Rao", note: "Review, return, approve, and comment" },
  { href: "/admin", label: "Admin / HR", name: "Priya Nair", note: "Govern completion, audit, unlock, export" }
];

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[hsl(var(--background))] p-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex size-11 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white">
              <Building2 className="size-5" />
            </div>
            <Badge className="w-fit">FY26 demo workspace</Badge>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-tight text-stone-950">
              AlignHQ goal operations portal
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-6 text-stone-600">
              A focused internal workflow for goal setting, manager approval, quarterly achievement tracking, and HR governance.
            </p>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Choose a demo role</CardTitle>
                  <p className="mt-1 text-sm text-stone-600">Seeded identities keep the primary demo path fast and reliable.</p>
                </div>
                <ShieldCheck className="size-5 text-[hsl(var(--primary))]" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {roles.map((role) => (
                <Link key={role.href} href={role.href} className="group rounded-lg border bg-white p-4 transition-colors hover:border-[hsl(var(--primary))]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-950">{role.name}</span>
                        <Badge variant="secondary">{role.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">{role.note}</p>
                    </div>
                    <Button size="icon" variant="ghost" aria-label={`Open ${role.label} demo`}>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
