export function getSupabaseEnv() {
  if (process.env.NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO === "true") {
    return { url: undefined, key: undefined, isConfigured: false };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key, isConfigured: Boolean(url && key) };
}

export function isForcedLocalDemoMode() {
  return process.env.NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO === "true";
}

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production") return { valid: true, missing: [] as string[] };
  const required = ["NEXT_PUBLIC_APP_URL"];
  const missing = required.filter((key) => !(process.env[key] ?? "").trim());
  return { valid: missing.length === 0, missing };
}
