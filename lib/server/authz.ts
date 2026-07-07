import { loadCurrentAppUser } from "@/lib/supabase/alignhq-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, Role } from "@/types/alignhq";

export async function resolveCurrentAppUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };

  const user = await loadCurrentAppUser(supabase).catch(() => null);
  return { supabase, user };
}

export function hasRole(user: AppUser | null, roles: Role[]) {
  return Boolean(user && roles.includes(user.role));
}
