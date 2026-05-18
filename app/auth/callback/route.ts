import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCurrentAppUser } from "@/lib/supabase/alignhq-repository";

const homeByRole = {
  Employee: "/employee",
  Manager: "/manager",
  Admin: "/admin"
} as const;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (!supabase || !code) redirect("/login");

  await supabase.auth.exchangeCodeForSession(code);
  let profile = await loadCurrentAppUser(supabase);

  if (!profile) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const email = user?.email;

    if (user?.id && email) {
      await supabase.from("users").update({ auth_user_id: user.id }).eq("email", email).is("auth_user_id", null);
      profile = await loadCurrentAppUser(supabase);
    }
  }

  redirect(profile ? homeByRole[profile.role] : "/login");
}
