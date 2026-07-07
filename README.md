<p align="center">
  <br />
  <strong>ALIGNHQ</strong>
</p>

<h1 align="center">Internal Goal Cycles, Governed From Draft To Audit</h1>

<p align="center">
  AlignHQ is a browser portal for employee goals, manager approvals, quarterly check-ins, HR governance, reports, analytics, and escalation notices.
</p>

<p align="center">
  <a href="#run-locally"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs" /></a>
  <a href="#stack"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /></a>
  <a href="#supabase-setup"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" /></a>
  <a href="#analytics"><img alt="Recharts" src="https://img.shields.io/badge/Recharts-Analytics-22C55E?style=for-the-badge" /></a>
  <a href="#microsoft-integrations"><img alt="Microsoft" src="https://img.shields.io/badge/Entra%20ID-Ready-2563EB?style=for-the-badge&logo=microsoft" /></a>
</p>

<p align="center">
  <a href="docs/ARCHITECTURE.md">Architecture</a>
  ·
  <a href="docs/SCHEMA_GRAPH.md">Schema Graph</a>
  ·
  <a href="docs/IMPLEMENTATION_STATUS.md">Implementation Status</a>
  ·
  <a href="docs/SUBMISSION_CHECKLIST.md">Submission Checklist</a>
</p>

---

## Why This Exists

Most goal systems either stop at form submission or turn progress tracking into a rating machine. AlignHQ keeps the workflow controlled without losing the human review loop.

Employees draft goals. Managers approve and lock them. Admins govern the cycle, unlock with reasons, inspect audits, and export evidence. The same app runs as a local demo or a Supabase-backed portal.

---

## Product Surface

| Role | What they do | Key screens |
|---|---|---|
| Employee | Draft goals, fix weightage, submit sheets, update quarterly progress | Goal Workspace, Quarterly Check-ins, Goal Health Cards |
| Manager | Review direct reports, edit targets, return sheets, approve and lock | Approval Desk, Team Check-ins, Team Actions |
| Admin / HR | Configure cycles, unlock sheets, audit changes, export reports, watch escalations | Governance Center, Escalation Center, Reports, Analytics |

| Module | Working capability |
|---|---|
| Goal Workspace | Goal creation, inline edits, weightage meter, submission validation |
| Approval Desk | Manager review, target edits, weightage edits, return, approve, lock |
| Shared KPI Manager | Department KPI assignment with primary-owner update sync |
| Quarterly Check-ins | Actuals, status, blocked flag, progress score, manager comments |
| Governance Center | Cycle windows, completion view, unlock reason modal, audit writes |
| Reporting Console | Achievement report, CSV export, audit timeline |
| Escalation Center | Late submission, approval, and check-in queues |
| Integration Center | Entra SSO readiness, Azure group mapping, email and Teams status |

---

## Demo Accounts

Seed demo users with `ALIGNHQ_DEMO_PASSWORD` and set the same value in `NEXT_PUBLIC_ALIGNHQ_DEMO_PASSWORD` for local sign-in buttons.

| Role | Email | Demo path |
|---|---|---|
| Employee | `asha.menon@alignhq.test` | Create goals, submit a sheet, add Q1 actuals |
| Manager | `isha.rao@alignhq.test` | Review team sheets, return or lock goals |
| Admin / HR | `priya.nair@alignhq.test` | Govern cycles, unlock sheets, inspect audits, export reports |

Local demo mode also supports role switching from the sidebar.

---

## Fast Demo Path

1. Open `/login`.
2. Choose **Asha Menon - Employee**.
3. Edit goals in Goal Workspace until total weightage is 100%.
4. Submit the sheet.
5. Switch to **Isha Rao - Manager**.
6. Review the sheet in Approval Desk, then return or approve and lock it.
7. Switch back to an approved employee and submit Q1 actuals.
8. Switch to **Priya Nair - Admin**.
9. Review governance, escalations, audit history, reports, and analytics.

Use **Reset demo data** in the sidebar to restore the seeded state.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui-style primitives on Radix |
| Data/Auth | Supabase Postgres, Auth, RLS |
| Charts | Recharts |
| Icons | lucide-react |
| Tests | Playwright |
| Deployment | Vercel plus Supabase |

---

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Quality checks:

```bash
npm run typecheck
npm run build
npm run test:e2e
```

---

## Environment

Create `.env.local` from `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_seed_scripts_only
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ALIGNHQ_DEMO_PASSWORD=your_demo_password_for_local_sign_in
ALIGNHQ_DEMO_PASSWORD=your_demo_password_for_seed_script
```

`SUPABASE_SERVICE_ROLE_KEY` is only for local seed scripts and server-side maintenance. Keep it out of browser code, client logs, and public deployments.

The app also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a fallback for the publishable key.

---

## Supabase Setup

Apply the schema:

```bash
supabase db push
```

Or paste `supabase/schema.sql` into the Supabase SQL editor.

Load deterministic demo data:

```bash
supabase db execute --file supabase/seed.sql
```

Create Supabase Auth users and map them to `public.users.auth_user_id`:

```bash
npm run supabase:seed-auth
```

For the older role-switcher flow without real Supabase Auth users, apply:

```bash
supabase db execute --file supabase/demo-access.sql
```

If an older database copy shows an RLS recursion error, apply:

```bash
supabase db execute --file supabase/rls-function-fix.sql
```

In the Supabase SQL editor, paste file contents rather than file paths.

---

## Data Model

The schema is small enough to inspect and strict enough to protect the workflow.

| Table | Purpose |
|---|---|
| `users` | App profiles, roles, departments, manager hierarchy |
| `goal_sheets` | Employee cycle sheets and approval states |
| `goals` | Individual KPI rows under a sheet |
| `goal_updates` | Quarterly actuals, status, blocked state, progress score |
| `manager_comments` | Manager check-in comments per goal and quarter |
| `shared_goals` | Manager-created shared KPIs |
| `shared_goal_links` | Links between shared KPIs and employee goals |
| `cycle_windows` | Admin-managed cycle and quarter windows |
| `audit_logs` | Trace record for governed actions |

Rules enforced by the database:

- One goal sheet per employee and cycle.
- Total goal weightage must equal 100 before submission or approval.
- Each goal must carry at least 10% weightage.
- A sheet can contain at most 8 goals.
- Locking a sheet locks its goals.
- Locked goals cannot be edited until Admin unlocks the sheet.
- Admin unlocks require an audit reason.

See [docs/SCHEMA_GRAPH.md](docs/SCHEMA_GRAPH.md) for the Mermaid ER diagram.

---

## Progress Rules

Progress score is for tracking. It is not a rating.

| UoM | Formula |
|---|---|
| Numeric / Percentage, Min | `achievement / target` |
| Numeric / Percentage, Max | `target / achievement` |
| Timeline | Completion date compared with deadline |
| Zero-based | `0` actual means `100`; any other value means `0` |

---

## Analytics

The analytics dashboard uses Recharts for:

- Quarter-over-quarter achievement trend
- Employee completion heatmap
- Goal distribution by thrust area
- Goal distribution by unit of measure
- Goal status distribution
- Department completion
- Manager effectiveness

---

## Microsoft Integrations

AlignHQ includes an Entra ID / Azure AD SSO entry point on `/login` and a Supabase Auth callback at `/auth/callback`.

Optional production variables:

```env
ENTRA_TENANT_ID=your_azure_tenant_id
ENTRA_CLIENT_ID=your_azure_app_client_id
ENTRA_CLIENT_SECRET=your_azure_app_client_secret
ENTRA_EMPLOYEE_GROUP_ID=azure_ad_group_id_for_employees
ENTRA_MANAGER_GROUP_ID=azure_ad_group_id_for_managers
ENTRA_ADMIN_GROUP_ID=azure_ad_group_id_for_hr_admins
TEAMS_WEBHOOK_URL=teams_workflow_or_incoming_webhook_url
TEAMS_WEBHOOK_ALLOWLIST=contoso.webhook.office.com
EMAIL_WEBHOOK_URL=email_provider_webhook_url
EMAIL_WEBHOOK_TOKEN=optional_email_webhook_bearer_token
EMAIL_WEBHOOK_ALLOWLIST=api.your-mail-provider.com
WEBHOOK_HMAC_SECRET=shared_hmac_secret_for_webhooks
DISPATCH_MAX_RETRIES=2
```

Sync Entra group membership and manager hierarchy into `public.users`:

```bash
npm run entra:sync-org
```

Dispatch active escalation notices from the Admin Escalations page, or call:

```bash
curl -X POST http://localhost:3000/api/integrations/dispatch-escalations \
  -H "x-idempotency-key: dispatch-q1-001" \
  -H "content-type: application/json" \
  -d "{\"quarter\":\"Q1\",\"origin\":\"http://localhost:3000\"}"
```

Notification payloads are generated in `lib/integrations/notifications.ts` and dispatched with optional host allowlists, retry/backoff, and optional `x-alignhq-signature` HMAC headers.

---

## Project Layout

```text
app/
  (auth)/login/page.tsx
  (dashboard)/employee/page.tsx
  (dashboard)/manager/page.tsx
  (dashboard)/admin/page.tsx
  actions/goals.ts
  api/
  auth/callback/route.ts
components/
  admin/
  auth/
  checkins/
  dashboard/
  goals/
  layout/
  manager/
  reports/
  ui/
lib/
  demo/seed-data.ts
  domain/rules.ts
  domain/escalations.ts
  integrations/
  supabase/
scripts/
  seed-demo-auth-users.mjs
  sync-entra-org.mjs
supabase/
  schema.sql
  seed.sql
  demo-access.sql
tests/e2e/
  primary-role-journey.spec.ts
types/
  alignhq.ts
docs/
  ARCHITECTURE.md
  SCHEMA_GRAPH.md
  IMPLEMENTATION_PLAN.md
  IMPLEMENTATION_STATUS.md
  SUBMISSION_CHECKLIST.md
```

---

## Architecture Notes

- Next.js App Router hosts the browser app and server routes.
- Supabase is the source of truth when configured.
- Local demo mode uses `localStorage` and deterministic seed data for offline judging.
- RLS policies scope data by employee ownership, direct manager access, and Admin/HR governance rights.
- `lib/domain/rules.ts` holds validation, scoring, CSV, check-in, and health-state logic.
- `lib/domain/escalations.ts` builds late submission, late approval, and missed check-in alerts.
- Playwright tests force local demo mode with `NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO=true`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system diagram.

---

## Documentation

| File | Purpose |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagram and hosting model |
| [docs/SCHEMA_GRAPH.md](docs/SCHEMA_GRAPH.md) | Supabase ER diagram |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Build plan and delivery stages |
| [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) | Completed work and remaining production tasks |
| [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) | Hackathon judging checklist |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Runtime modes, security controls, troubleshooting, and incident basics |

---

## Deployment

Deploy on Vercel:

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add Supabase environment variables.
4. Add optional Entra, Teams, and email variables if live integrations are needed.
5. Deploy.

For a no-network demo, leave Supabase variables unset and use local demo mode.
