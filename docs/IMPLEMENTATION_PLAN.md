# AlignHQ Implementation Plan

## Phase 1: Product Shell and Role Demo

Status: Complete

- Build a Next.js 15 App Router project with Employee, Manager, and Admin routes.
- Add a compact enterprise layout with left navigation, top utility controls, status chips, dense tables, and empty/loading/error states.
- Seed role identities for a reliable 3-4 minute hackathon walkthrough.

## Phase 2: Core Workflow

Status: Complete

- Employee Goal Workspace for Draft and Returned goal sheets.
- Business-rule validation for total weightage, minimum weightage, required fields, and max goal count.
- Manager Approval Desk for submitted direct-report goal sheets.
- Inline target and weightage edits before approval.
- Return for rework and approve-and-lock transitions.

## Phase 3: Quarterly Tracking

Status: Complete

- Q1-Q4 quarter selector and seeded cycle windows.
- Employee actual achievement updates.
- Goal status, blocked flag, and manager check-in comments.
- Tracking-only progress score formulas for Min, Max, Timeline, and Zero-based goals.
- Rule-based Goal Health Cards.

## Phase 4: Governance and Reporting

Status: Complete

- Admin completion dashboard.
- Admin unlock flow with mandatory reason.
- Audit log timeline.
- CSV achievement export.
- Shared KPI manager with weightage-only recipient editing and primary-owner update sync in demo state.
- Optional Recharts analytics view.

## Phase 5: Supabase Backend Readiness

Status: Complete for handoff

- Supabase schema for users, goal sheets, goals, updates, comments, shared goals, links, cycle windows, and audit logs.
- Database-side validation function for goal sheet submission/approval/lock.
- Trigger-based lock behavior and locked-goal mutation guard.
- RLS policies for employee, manager, and admin visibility/write boundaries.
- Deterministic seed SQL for a live Supabase demo environment.

## Remaining Production Work

Status: Not required for hackathon demo

- Create real Supabase Auth users and map them to `public.users.auth_user_id`.
- Replace local seeded demo repository with Supabase-backed data loading and mutations.
- Add Playwright end-to-end tests for the primary role journey.
- Add CI for build, audit, and typecheck.
