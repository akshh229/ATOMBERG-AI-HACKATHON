# AlignHQ Architecture

```mermaid
flowchart LR
    browser[Web browser portal]
    next[Next.js 15 App Router<br/>Vercel hosting]
    supabase[Supabase<br/>Postgres, Auth, RLS]
    entra[Microsoft Entra ID<br/>SSO and group claims]
    teams[Microsoft Teams<br/>Adaptive card alerts]
    email[Email provider<br/>Submission and reminder notices]

    browser --> next
    next --> supabase
    entra --> supabase
    next --> teams
    next --> email

    subgraph App Modules
      goals[Goal creation and validation]
      approval[Manager approval and lock]
      tracking[Quarterly check-ins]
      admin[Admin governance and escalation]
      analytics[Analytics dashboards]
    end

    next --> goals
    next --> approval
    next --> tracking
    next --> admin
    next --> analytics
```

## Hosting Model

- **Frontend and server routes:** Next.js App Router.
- **Database:** Supabase Postgres.
- **Auth:** Supabase Auth with seeded credentials and Microsoft Entra ID SSO entry point.
- **Authorization:** RLS policies over employee, manager, and Admin / HR scopes.
- **Notifications:** Integration-ready email and Microsoft Teams adaptive-card payloads.
- **Escalations:** Rule-based engine for late submissions, late approvals, and missed check-ins.
