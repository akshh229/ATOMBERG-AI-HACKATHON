# AlignHQ Submission Checklist

## Required For Judging

- [x] Web browser accessible portal.
- [x] Employee demo journey: create/edit goals, validate weightage, submit.
- [x] Manager demo journey: review direct reports, edit, return, approve, lock.
- [x] Admin / HR demo journey: cycle windows, unlock, audit, reports, analytics, escalations.
- [x] Login credentials or role switcher for Employee, Manager, and Admin.
- [x] Version-controlled repository.
- [x] Architecture diagram: `docs/ARCHITECTURE.md`.
- [ ] Hosted demo URL: add after deployment.

## Feature Checklist

| Area | Status |
|---|---|
| Auth / Access | Supabase Auth, seeded demo credentials, role switcher, Entra SSO entry point |
| Goal creation | Full employee goal form with validations |
| Approval flow | Manager review, edit, return, approve, lock |
| Shared KPI | Multi-user assignment and primary-owner sync |
| Quarterly tracking | Actuals, status, progress formulas |
| Check-ins | Manager structured comments |
| Admin control | Cycle windows, unlock, exception handling |
| Governance | Audit logs for post-lock edits and admin actions |
| Reports | CSV export and completion dashboard |
| Bonus 1 | Entra ID / Azure AD SSO entry point, callback, and Graph org/group sync script |
| Bonus 2 | Email / Teams notification payloads and dispatch endpoint |
| Bonus 3 | Rule-based escalation engine, Admin/HR log, and dispatch controls |
| Bonus 4 | QoQ trends, heatmaps, distributions, manager effectiveness analytics |
| Submission | GitHub, hosted app URL, architecture diagram, credentials |

## Demo Credentials

All seeded demo accounts use:

```text
AlignHQ-demo-2026!
```

- Employee: `asha.menon@alignhq.test`
- Manager: `isha.rao@alignhq.test`
- Admin / HR: `priya.nair@alignhq.test`
