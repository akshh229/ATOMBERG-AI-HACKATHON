-- Hackathon demo access policies.
--
-- Use this file only for the demo-first role switcher build, where the browser
-- uses the Supabase publishable key without real Supabase Auth users.
-- For production, do not apply these policies; map auth.users to public.users
-- and rely on the role-scoped policies in schema.sql.

create policy demo_users_all
on public.users
for all
to anon
using (true)
with check (true);

create policy demo_goal_sheets_all
on public.goal_sheets
for all
to anon
using (true)
with check (true);

create policy demo_goals_all
on public.goals
for all
to anon
using (true)
with check (true);

create policy demo_shared_goals_all
on public.shared_goals
for all
to anon
using (true)
with check (true);

create policy demo_shared_goal_links_all
on public.shared_goal_links
for all
to anon
using (true)
with check (true);

create policy demo_goal_updates_all
on public.goal_updates
for all
to anon
using (true)
with check (true);

create policy demo_manager_comments_all
on public.manager_comments
for all
to anon
using (true)
with check (true);

create policy demo_cycle_windows_all
on public.cycle_windows
for all
to anon
using (true)
with check (true);

create policy demo_audit_logs_all
on public.audit_logs
for all
to anon
using (true)
with check (true);
