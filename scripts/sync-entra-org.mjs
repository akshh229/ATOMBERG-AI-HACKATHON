import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    process.env[trimmed.slice(0, index)] ??= trimmed.slice(index + 1);
  }
}

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ENTRA_TENANT_ID", "ENTRA_CLIENT_ID", "ENTRA_CLIENT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const groupMappings = [
  { env: "ENTRA_EMPLOYEE_GROUP_ID", role: "Employee" },
  { env: "ENTRA_MANAGER_GROUP_ID", role: "Manager" },
  { env: "ENTRA_ADMIN_GROUP_ID", role: "Admin" }
].filter((mapping) => process.env[mapping.env]);

if (groupMappings.length === 0) {
  console.error("Set at least one of ENTRA_EMPLOYEE_GROUP_ID, ENTRA_MANAGER_GROUP_ID, or ENTRA_ADMIN_GROUP_ID.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function graphToken() {
  const response = await fetch(`https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ENTRA_CLIENT_ID,
      client_secret: process.env.ENTRA_CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials"
    })
  });

  if (!response.ok) throw new Error(`Unable to get Graph token: ${response.status} ${response.statusText}`);
  return (await response.json()).access_token;
}

async function graphGet(token, path) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Graph request failed ${path}: ${response.status} ${response.statusText}`);
  return response.json();
}

async function groupMembers(token, groupId) {
  const members = [];
  let path = `/groups/${groupId}/members/microsoft.graph.user?$select=id,displayName,mail,userPrincipalName,jobTitle,department`;

  while (path) {
    const page = await graphGet(token, path);
    members.push(...(page.value ?? []));
    path = page["@odata.nextLink"] ? new URL(page["@odata.nextLink"]).pathname + new URL(page["@odata.nextLink"]).search : "";
  }

  return members;
}

async function managerEmail(token, userId) {
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/manager?$select=mail,userPrincipalName`, {
    headers: { authorization: `Bearer ${token}` }
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Manager lookup failed: ${response.status} ${response.statusText}`);
  const manager = await response.json();
  return manager.mail ?? manager.userPrincipalName ?? null;
}

const token = await graphToken();
const seenByEmail = new Map();

for (const mapping of groupMappings) {
  const members = await groupMembers(token, process.env[mapping.env]);
  for (const member of members) {
    const email = member.mail ?? member.userPrincipalName;
    if (!email) continue;

    seenByEmail.set(email.toLowerCase(), {
      email,
      name: member.displayName ?? email,
      role: mapping.role,
      title: member.jobTitle ?? "Team Member",
      department: member.department ?? "Unassigned",
      graphId: member.id
    });
  }
}

for (const user of seenByEmail.values()) {
  const { error } = await supabase.from("users").upsert(
    {
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      department: user.department
    },
    { onConflict: "email" }
  );

  if (error) throw error;
}

for (const user of seenByEmail.values()) {
  const manager = await managerEmail(token, user.graphId);
  if (!manager) continue;

  const { data: managerProfile } = await supabase.from("users").select("id").eq("email", manager).maybeSingle();
  if (!managerProfile) continue;

  const { error } = await supabase.from("users").update({ manager_id: managerProfile.id }).eq("email", user.email);
  if (error) throw error;
}

console.log(`Synced ${seenByEmail.size} Entra users into public.users.`);
