import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const demoAccounts = [
  { name: "Asha Menon", email: "asha.menon@alignhq.test", password: "AlignHQ-demo-2026!", role: "Employee" },
  { name: "Rahul Bansal", email: "rahul.bansal@alignhq.test", password: "AlignHQ-demo-2026!", role: "Employee" },
  { name: "Neha Shah", email: "neha.shah@alignhq.test", password: "AlignHQ-demo-2026!", role: "Employee" },
  { name: "Kabir Suri", email: "kabir.suri@alignhq.test", password: "AlignHQ-demo-2026!", role: "Employee" },
  { name: "Mira Kapoor", email: "mira.kapoor@alignhq.test", password: "AlignHQ-demo-2026!", role: "Employee" },
  { name: "Isha Rao", email: "isha.rao@alignhq.test", password: "AlignHQ-demo-2026!", role: "Manager" },
  { name: "Vikram Sethi", email: "vikram.sethi@alignhq.test", password: "AlignHQ-demo-2026!", role: "Manager" },
  { name: "Priya Nair", email: "priya.nair@alignhq.test", password: "AlignHQ-demo-2026!", role: "Admin" }
];

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findAuthUserByEmail(email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) return null;

    page += 1;
  }
}

for (const account of demoAccounts) {
  const existing = await findAuthUserByEmail(account.email);
  const result = existing
    ? await supabase.auth.admin.updateUserById(existing.id, {
        password: account.password,
        email_confirm: true,
        user_metadata: { name: account.name, role: account.role }
      })
    : await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { name: account.name, role: account.role }
      });

  if (result.error) throw result.error;
  const authUser = result.data.user;

  if (!authUser) {
    throw new Error(`Unable to create or update auth user for ${account.email}`);
  }

  const { error: profileError } = await supabase.from("users").update({ auth_user_id: authUser.id }).eq("email", account.email);
  if (profileError) throw profileError;

  console.log(`${existing ? "Updated" : "Created"} ${account.email} -> ${authUser.id}`);
}
