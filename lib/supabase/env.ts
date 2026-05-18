export function getSupabaseEnv() {
  if (process.env.NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO === "true") {
    return { url: undefined, key: undefined, isConfigured: false };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key, isConfigured: Boolean(url && key) };
}
