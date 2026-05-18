"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  if (typeof window !== "undefined" && window.localStorage.getItem("alignhq-force-local-demo") === "true") {
    return null;
  }

  const { url, key } = getSupabaseEnv();

  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
