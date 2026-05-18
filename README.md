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

The app runs immediately with seeded demo data stored in `localStorage`. Supabase clients, middleware, route handlers, and schema are included so the project can be connected to a real Supabase project after the hackathon demo path is stable.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Build check:

```bash
npm run build
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
| Reporting & Audit Console | Achievement report, CSV export, audit timeline. |
| Goal Health Cards | Rule-based Healthy / Needs Attention / Delayed / Blocked states. |
| Analytics Dashboard | Recharts trend and department completion views. |

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
  api/reports/achievement/route.ts
components/
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
  domain/rules.ts
  supabase/browser.ts
  supabase/server.ts
  utils/cn.ts
types/alignhq.ts
supabase/schema.sql
```

## Supabase Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The app also supports the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name as a fallback.

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

For the hackathon role-switcher demo without real Supabase Auth users, also run:

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

## Seed Data Strategy

Seed data lives in `lib/demo/seed-data.ts` and includes:

- 1 Admin / HR user
- 2 Managers
- 5 Employees
- Sales, Operations, Product, and HR departments
- Draft, Submitted, Returned, Approved, and Locked goal sheets
- Shared KPI records
- Q1 updates
- Manager comments
- Audit log entries

The demo uses `localStorage` so judges can interact freely without network setup. The domain model mirrors the Supabase schema to keep migration straightforward.

## Architecture Notes

- `lib/domain/rules.ts` is the shared business-rule layer for validation, score computation, health state, check-in completion, and CSV generation.
- Client dashboards use seeded data for smooth demoability; Supabase clients and middleware are present for real auth/session integration.
- The CSV export route demonstrates a server route handler and can be swapped from seeded data to Supabase queries.
- UI components follow shadcn conventions: small primitives, Radix for interactive behavior, `cn()` for class composition, and compact product surfaces.
- The visual system uses warm neutrals, graphite navigation, and a restrained teal accent.
- `docs/IMPLEMENTATION_PLAN.md` and `docs/IMPLEMENTATION_STATUS.md` document what is complete and what remains for a production pilot.

## Deployment

Deploy on Vercel:

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Add Supabase environment variables if using a live project.
4. Deploy.

The app is cost-aware: Vercel static/serverless hosting plus Supabase managed Postgres/Auth is enough for the hackathon and a credible internal pilot.
