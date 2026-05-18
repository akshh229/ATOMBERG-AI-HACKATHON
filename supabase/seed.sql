-- AlignHQ demo seed data.
-- This file intentionally uses deterministic UUIDs so the hackathon demo is repeatable.

insert into public.users (id, name, email, role, title, department, manager_id) values
  ('00000000-0000-0000-0000-000000000101', 'Isha Rao', 'isha.rao@alignhq.test', 'Manager', 'Sales Manager', 'Sales', null),
  ('00000000-0000-0000-0000-000000000102', 'Vikram Sethi', 'vikram.sethi@alignhq.test', 'Manager', 'Operations Manager', 'Operations', null),
  ('00000000-0000-0000-0000-000000000201', 'Priya Nair', 'priya.nair@alignhq.test', 'Admin', 'HR Business Partner', 'HR', null),
  ('00000000-0000-0000-0000-000000000301', 'Asha Menon', 'asha.menon@alignhq.test', 'Employee', 'Regional Sales Executive', 'Sales', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000302', 'Rahul Bansal', 'rahul.bansal@alignhq.test', 'Employee', 'Channel Growth Lead', 'Sales', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000303', 'Neha Shah', 'neha.shah@alignhq.test', 'Employee', 'Fulfilment Analyst', 'Operations', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000304', 'Kabir Suri', 'kabir.suri@alignhq.test', 'Employee', 'Product Analyst', 'Product', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000305', 'Mira Kapoor', 'mira.kapoor@alignhq.test', 'Employee', 'HR Operations Partner', 'HR', '00000000-0000-0000-0000-000000000101')
on conflict (email) do nothing;

insert into public.cycle_windows (id, label, quarter, starts_at, ends_at, active) values
  ('10000000-0000-0000-0000-000000000001', 'Goal Setting', null, '2026-05-01', '2026-05-31', true),
  ('10000000-0000-0000-0000-000000000002', 'Q1 Update', 'Q1', '2026-07-01', '2026-07-31', true),
  ('10000000-0000-0000-0000-000000000003', 'Q2 Update', 'Q2', '2026-10-01', '2026-10-31', false),
  ('10000000-0000-0000-0000-000000000004', 'Q3 Update', 'Q3', '2027-01-01', '2027-01-31', false),
  ('10000000-0000-0000-0000-000000000005', 'Q4 / Annual Update', 'Q4', '2027-03-01', '2027-04-15', false)
on conflict (id) do nothing;

insert into public.goal_sheets (id, employee_id, cycle, state, returned_comment, locked_at) values
  ('20000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', 'FY26', 'Draft', null, null),
  ('20000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', 'FY26', 'Submitted', null, null),
  ('20000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', 'FY26', 'Locked', null, '2026-05-28T11:15:00Z'),
  ('20000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000304', 'FY26', 'Returned', 'Please split product adoption into measurable milestones.', null),
  ('20000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000305', 'FY26', 'Approved', null, null)
on conflict (employee_id, cycle) do nothing;

insert into public.shared_goals (id, title, description, thrust_area, target, uom_type, progress_direction, primary_owner_id, created_by) values
  (
    '30000000-0000-0000-0000-000000000001',
    'Launch quarterly dealer activation KPI',
    'Departmental activation target for channel-facing functions.',
    'Revenue Growth',
    '80',
    'Numeric',
    'Min',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000101'
  )
on conflict (id) do nothing;

insert into public.goals (id, sheet_id, employee_id, shared_goal_id, thrust_area, title, description, uom_type, progress_direction, target, weightage, locked) values
  ('40000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', null, 'Revenue Growth', 'Increase qualified dealer pipeline', 'Build and progress a qualified pipeline for priority territories.', 'Numeric', 'Min', '120', 40, false),
  ('40000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', null, 'Customer Experience', 'Improve dealer response SLA', 'Improve response discipline for dealer service requests.', 'Percentage', 'Min', '92', 30, false),
  ('40000000-0000-0000-0000-000000000103', '20000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000301', null, 'Operational Excellence', 'Complete territory plan refresh', 'Submit updated coverage plan for all assigned districts.', 'Timeline', 'Min', '2026-07-31', 20, false),
  ('40000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', '30000000-0000-0000-0000-000000000001', 'Revenue Growth', 'Launch quarterly dealer activation KPI', 'Shared KPI assigned to channel and operations participants.', 'Numeric', 'Min', '80', 35, false),
  ('40000000-0000-0000-0000-000000000202', '20000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', null, 'Customer Experience', 'Reduce escalation backlog', 'Close pending escalations older than 14 days.', 'Zero-based', 'Min', '0', 30, false),
  ('40000000-0000-0000-0000-000000000203', '20000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000302', null, 'People Capability', 'Coach partner success representatives', 'Run enablement sessions and document action items.', 'Numeric', 'Min', '6', 35, false),
  ('40000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', '30000000-0000-0000-0000-000000000001', 'Operational Excellence', 'Launch quarterly dealer activation KPI', 'Shared KPI reporting support for operations.', 'Numeric', 'Min', '80', 25, true),
  ('40000000-0000-0000-0000-000000000302', '20000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', null, 'Risk and Compliance', 'Reduce dispatch reconciliation gaps', 'Keep monthly reconciliation exceptions below agreed threshold.', 'Percentage', 'Max', '2', 35, true),
  ('40000000-0000-0000-0000-000000000303', '20000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', null, 'Customer Experience', 'Complete service handoff SOP', 'Publish final SOP for dispatch-to-service handoff.', 'Timeline', 'Min', '2026-07-25', 40, true),
  ('40000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000304', null, 'Product Adoption', 'Improve dashboard adoption', 'Increase weekly active usage among sales managers.', 'Percentage', 'Min', '70', 50, false),
  ('40000000-0000-0000-0000-000000000402', '20000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000304', null, 'Operational Excellence', 'Reduce insight turnaround time', 'Reduce cycle time for monthly insight requests.', 'Numeric', 'Max', '5', 50, false),
  ('40000000-0000-0000-0000-000000000501', '20000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000305', null, 'People Capability', 'Improve goal completion readiness', 'Run readiness clinics for managers before review windows.', 'Numeric', 'Min', '4', 60, false),
  ('40000000-0000-0000-0000-000000000502', '20000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000305', null, 'Risk and Compliance', 'Close audit exceptions', 'Close outstanding exceptions from prior goal cycle audit.', 'Zero-based', 'Min', '0', 40, false)
on conflict (id) do nothing;

insert into public.shared_goal_links (shared_goal_id, goal_id, employee_id) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302'),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303')
on conflict (shared_goal_id, employee_id) do nothing;

insert into public.goal_updates (goal_id, employee_id, quarter, actual, status, blocked, progress_score, submitted_at) values
  ('40000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000303', 'Q1', '64', 'On Track', false, 80, '2026-07-18T10:30:00Z'),
  ('40000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000303', 'Q1', '3', 'On Track', false, 67, '2026-07-20T09:10:00Z'),
  ('40000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000303', 'Q1', '2026-07-29', 'Completed', false, 80, '2026-07-29T12:20:00Z')
on conflict (goal_id, quarter) do nothing;

insert into public.manager_comments (id, sheet_id, goal_id, manager_id, quarter, comment, created_at) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000303', '40000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', 'Q1', 'Good root-cause visibility. Split vendor-driven exceptions in Q2.', '2026-07-22T14:00:00Z')
on conflict (id) do nothing;

insert into public.audit_logs (id, actor_id, action, entity_type, entity_id, previous_value, new_value, reason, created_at) values
  (
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000102',
    'Approved and locked goal sheet',
    'goal_sheet',
    '20000000-0000-0000-0000-000000000303',
    '{"state":"Submitted"}',
    '{"state":"Locked"}',
    'Goals reviewed for FY26',
    '2026-05-28T11:15:00Z'
  )
on conflict (id) do nothing;
