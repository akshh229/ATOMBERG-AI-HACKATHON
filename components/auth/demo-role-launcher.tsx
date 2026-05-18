"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoAccounts } from "@/lib/demo/demo-accounts";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DemoRoleLauncher() {
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient>>(null);

  useEffect(() => {
    setSupabase(createSupabaseBrowserClient());
  }, []);

  async function launch(account: (typeof demoAccounts)[number]) {
    if (!supabase) return;

    setBusyRole(account.role);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password
    });

    if (signInError) {
      setError(`${signInError.message}. Run npm run supabase:seed-auth after seeding the database.`);
      setBusyRole(null);
      return;
    }

    window.location.href = account.href;
  }

  async function launchEntraSso() {
    if (!supabase) return;

    setError("");
    const { error: ssoError } = await supabase.auth.signInWithOAuth({
      provider: "azure" as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (ssoError) setError(`${ssoError.message}. Configure the Azure provider in Supabase Auth before using Entra ID SSO.`);
  }

  return (
    <Card className="motion-pop">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Choose a demo role</CardTitle>
            <p className="mt-1 text-sm text-stone-600">
              {supabase ? "Uses seeded Supabase Auth demo accounts." : "No Supabase env detected; opening local demo mode."}
            </p>
          </div>
          <ShieldCheck className="size-5 text-[hsl(var(--primary))]" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {supabase ? (
          <Button variant="secondary" className="justify-start" onClick={() => void launchEntraSso()}>
            <KeyRound className="size-4" />
            Continue with Microsoft Entra ID
          </Button>
        ) : null}
        {demoAccounts.map((account) => {
          const content = (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-950">{account.name}</span>
                  <Badge variant="secondary">{account.role === "Admin" ? "Admin / HR" : account.role}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">{account.note}</p>
              </div>
              <span className="inline-flex size-9 items-center justify-center rounded-md text-stone-700 transition-colors group-hover:bg-stone-100" aria-label={`Open ${account.role} demo`}>
                <ArrowRight className="size-4" />
              </span>
            </div>
          );

          return supabase ? (
            <button
              key={account.href}
              className="interactive-lift group rounded-lg border bg-white p-4 text-left transition-colors hover:border-[hsl(var(--primary))] disabled:cursor-wait disabled:opacity-70"
              disabled={Boolean(busyRole)}
              onClick={() => void launch(account)}
            >
              {content}
            </button>
          ) : (
            <Link key={account.href} href={account.href} className="interactive-lift group rounded-lg border bg-white p-4 transition-colors hover:border-[hsl(var(--primary))]">
              {content}
            </Link>
          );
        })}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" aria-live="polite">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
