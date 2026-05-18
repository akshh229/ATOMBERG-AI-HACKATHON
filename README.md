# AlignHQ

AlignHQ is a hackathon-ready internal goal setting and quarterly tracking portal. It is built as a focused enterprise workflow product for employees, managers, and HR/Admin teams.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI primitives | shadcn/ui-style components on Radix primitives |
| Backend / DB / Auth | Supabase-ready via `@supabase/ssr` and SQL schema |
| Charts | Recharts |
| Deployment | Vercel + Supabase |

The app runs immediately in local demo mode and switches to Supabase-backed loading and mutations when Supabase environment variables and Auth demo users are configured.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Build check:

```bash
npm run typecheck
npm run build
npm run test:e2e
```

## Demo Path

1. Open `/login` and choose **Asha Menon - Employee**.
2. In Goal Workspace, edit goals and resolve the live weightage validation until the total is 100%.
3. Submit the goal sheet.
4. Switch to **Isha Rao - Manager** and open Approval Desk.
5. Edit a direct report target or weightage inline, then return or approve and lock.
6. Switch back to an approved employee and submit Q1 actuals in Quarterly Check-ins.
7. View Goal Health Cards.
8. Switch to **Priya Nair - Admin** to review completion, unlock a locked sheet with a reason, inspect audit history, and export CSV.

Use **Reset demo data** in the sidebar to restore the seeded state.

## Implemented Modules

| Module | What it covers |
|---|---|
| Goal Workspace | Goal creation, draft editing, validation meter, submit for approval. |
| Approval Desk | Manager direct-report review, inline target/weightage edits, return, approve and lock. |
| Shared KPI Manager | Linked departmental KPI view with recipient-only weightage editing and primary-owner update sync. |
| Quarterly Check-ins | Employee actual achievement updates, status, blocked flag, manager comments. |
| Admin Governance Center | Cycle windows, completion dashboard, unlock reason modal, audit entries. |
| Escalation Center | Rule-based reminders and escalations for late goal submission, manager approval, and quarterly check-ins. |
| Integration Center | Entra ID / Azure AD SSO readiness, Azure group role mapping, org hierarchy, email and Teams status. |
| Reporting & Audit Console | Achievement report, CSV export, audit timeline. |
| Goal Health Cards | Rule-based Healthy / Needs Attention / Delayed / Blocked states. |
| Analytics Dashboard | QoQ trends, completion heatmaps, goal distribution, and manager effectiveness views. |

## Business Rules

- Total weightage across a goal sheet must equal exactly 100%.
- Minimum weightage per goal is 10%.
- Maximum number of goals per employee is 8.
- Employees can edit only Draft or Returned sheets.
- Manager approval locks goals.
- Admin unlock requires a reason and creates an audit log entry.
- Progress score is for tracking only, not ratings.

Progress formulas:

| UoM | Formula |
|---|---|
| Numeric / Percentage, Min | `achievement / target` |
| Numeric / Percentage, Max | `target / achievement` |
| Timeline | Completion date compared with deadline |
| Zero-based | If actual is `0`, score is `100`; otherwise `0` |

## Project Structure

```text
app/
  (auth)/login/page.tsx
  (dashboard)/employee/page.tsx
  (dashboard)/manager/page.tsx
  (dashboard)/admin/page.tsx
  actions/goals.ts
  auth/callback/route.ts
  api/integrations/dispatch-escalations/route.ts
  api/reports/achievement/route.ts
components/
  auth/
  admin/
  checkins/
  dashboard/
  goals/
  layout/
  manager/
  reports/
  ui/
lib/
  demo/seed-data.ts
  domain/escalations.ts
  domain/rules.ts
  integrations/dispatch.ts
  integrations/notifications.ts
  supabase/browser.ts
  supabase/server.ts
  utils/cn.ts
scripts/
  seed-demo-auth-users.mjs
  sync-entra-org.mjs
types/alignhq.ts
supabase/schema.sql
```

## Supabase Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_seed_scripts_only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use `.env.example` as the complete template for Supabase, Entra, Teams, and email integration settings.

The app also supports the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name as a fallback. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or deployment logs.

Apply the schema:

```bash
supabase db push
```

Or paste `supabase/schema.sql` into the Supabase SQL editor.

Load deterministic demo data:

```bash
supabase db execute --file supabase/seed.sql
```

Or paste `supabase/seed.sql` into the Supabase SQL editor after the schema.

Create real Supabase Auth users for the primary demo roles and map them to `public.users.auth_user_id`:

```bash
npm run supabase:seed-auth
```

The script creates Auth users for every row in `supabase/seed.sql`. The primary launch accounts are:

| Role | Email | Password |
|---|---|---|
| Employee | `asha.menon@alignhq.test` | `AlignHQ-demo-2026!` |
| Manager | `isha.rao@alignhq.test` | `AlignHQ-demo-2026!` |
| Admin / HR | `priya.nair@alignhq.test` | `AlignHQ-demo-2026!` |

For the old hackathon role-switcher demo without real Supabase Auth users, also run:

```bash
supabase db execute --file supabase/demo-access.sql
```

If you already applied an older copy of `schema.sql` and see an RLS recursion error, run:

```bash
supabase db execute --file supabase/rls-function-fix.sql
```

In the Supabase SQL editor, paste the contents of those files rather than the file paths.

The schema includes:

- `users`
- `goal_sheets`
- `goals`
- `goal_updates`
- `manager_comments`
- `shared_goals`
- `shared_goal_links`
- `cycle_windows`
- `audit_logs`

RLS is enabled on all core tables, with policies for employee ownership, manager direct-report access, and Admin/HR governance access. The schema also includes database-side validation and lock-guard triggers.

## Microsoft Integrations

AlignHQ includes an Entra ID SSO entry point on `/login`, an OAuth callback at `/auth/callback`, and an Admin Integration Center for group-role mapping and org hierarchy visibility. Configure the Azure provider in Supabase Auth before using the Microsoft SSO button.

The escalation module generates email and Microsoft Teams adaptive-card notification payloads with deep links to the relevant goal sheet. Production delivery can be wired to Microsoft Graph, SMTP, or a Teams workflow/webhook from the notification builder in `lib/integrations/notifications.ts`.

Optional production integration variables:

```env
ENTRA_TENANT_ID=your_azure_tenant_id
ENTRA_CLIENT_ID=your_azure_app_client_id
ENTRA_CLIENT_SECRET=your_azure_app_client_secret
ENTRA_EMPLOYEE_GROUP_ID=azure_ad_group_id_for_employees
ENTRA_MANAGER_GROUP_ID=azure_ad_group_id_for_managers
ENTRA_ADMIN_GROUP_ID=azure_ad_group_id_for_hr_admins
TEAMS_WEBHOOK_URL=teams_workflow_or_incoming_webhook_url
EMAIL_WEBHOOK_URL=email_provider_webhook_url
EMAIL_WEBHOOK_TOKEN=optional_email_webhook_bearer_token
```

Sync Entra group membership and manager hierarchy into `public.users`:

```bash
npm run entra:sync-org
```

Dispatch active escalation notifications from the Admin Escalations page, or call:

```bash
curl -X POST http://localhost:3000/api/integrations/dispatch-escalations \
  -H "content-type: application/json" \
  -d "{\"quarter\":\"Q1\",\"origin\":\"http://localhost:3000\"}"
```

## Data Strategy

Supabase is the configured source of truth for authenticated runs. `lib/supabase/alignhq-repository.ts` loads workspace data and writes goal, sheet, quarterly update, comment, cycle window, and audit mutations through Supabase.

Local fallback seed data lives in `lib/demo/seed-data.ts` and includes:

- 1 Admin / HR user
- 2 Managers
- 5 Employees
- Sales, Operations, Product, and HR departments
- Draft, Submitted, Returned, Approved, and Locked goal sheets
- Shared KPI records
- Q1 updates
- Manager comments
- Audit log entries

Local demo mode uses `localStorage` so judges can interact freely without network setup. Playwright tests force this mode with `NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO=true`.

## Architecture Notes

- `lib/domain/rules.ts` is the shared business-rule layer for validation, score computation, health state, check-in completion, and CSV generation.
- Client dashboards load Supabase data when a session or demo-access policies expose rows, and fall back to local demo state when Supabase is not configured.
- The CSV export route uses the server Supabase client when available and falls back to seed data otherwise.
- UI components follow shadcn conventions: small primitives, Radix for interactive behavior, `cn()` for class composition, and compact product surfaces.
- The visual system uses warm neutrals, graphite navigation, and a restrained teal accent.
- `docs/IMPLEMENTATION_PLAN.md`, `docs/IMPLEMENTATION_STATUS.md`, `docs/ARCHITECTURE.md`, and `docs/SUBMISSION_CHECKLIST.md` document delivery, architecture, and judging readiness.

## Deployment

Deploy on Vercel:

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Add Supabase environment variables if using a live project.
4. Deploy.

The app is cost-aware: Vercel static/serverless hosting plus Supabase managed Postgres/Auth is enough for the hackathon and a credible internal pilot.
