# Supabase Schema Graph

This graph mirrors `supabase/schema.sql` and shows the core AlignHQ data model: users own goal sheets, sheets contain goals, quarterly updates and manager comments attach to goals, and shared KPI records link goals across employees.

```mermaid
erDiagram
    USERS {
        uuid id PK
        uuid auth_user_id FK
        text name
        text email UK
        app_role role
        text title
        text department
        uuid manager_id FK
        timestamptz created_at
    }

    GOAL_SHEETS {
        uuid id PK
        uuid employee_id FK
        text cycle
        goal_sheet_state state
        text returned_comment
        timestamptz locked_at
        timestamptz created_at
        timestamptz updated_at
    }

    GOALS {
        uuid id PK
        uuid sheet_id FK
        uuid employee_id FK
        uuid shared_goal_id FK
        text thrust_area
        text title
        text description
        uom_type uom_type
        progress_direction progress_direction
        text target
        numeric weightage
        boolean locked
        timestamptz created_at
        timestamptz updated_at
    }

    SHARED_GOALS {
        uuid id PK
        text title
        text description
        text thrust_area
        text target
        uom_type uom_type
        progress_direction progress_direction
        uuid primary_owner_id FK
        uuid created_by FK
        timestamptz created_at
    }

    SHARED_GOAL_LINKS {
        uuid id PK
        uuid shared_goal_id FK
        uuid goal_id FK
        uuid employee_id FK
        timestamptz created_at
    }

    GOAL_UPDATES {
        uuid id PK
        uuid goal_id FK
        uuid employee_id FK
        quarter_type quarter
        text actual
        goal_status status
        boolean blocked
        numeric progress_score
        timestamptz submitted_at
    }

    MANAGER_COMMENTS {
        uuid id PK
        uuid sheet_id FK
        uuid goal_id FK
        uuid manager_id FK
        quarter_type quarter
        text comment
        timestamptz created_at
    }

    CYCLE_WINDOWS {
        uuid id PK
        text label
        quarter_type quarter
        date starts_at
        date ends_at
        boolean active
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb previous_value
        jsonb new_value
        text reason
        timestamptz created_at
    }

    USERS ||--o{ USERS : manages
    USERS ||--o{ GOAL_SHEETS : owns
    USERS ||--o{ GOALS : owns
    USERS ||--o{ SHARED_GOALS : primary_owner
    USERS ||--o{ SHARED_GOALS : created_by
    USERS ||--o{ SHARED_GOAL_LINKS : receives
    USERS ||--o{ GOAL_UPDATES : submits
    USERS ||--o{ MANAGER_COMMENTS : writes
    USERS ||--o{ AUDIT_LOGS : performs

    GOAL_SHEETS ||--o{ GOALS : contains
    GOAL_SHEETS ||--o{ MANAGER_COMMENTS : receives

    SHARED_GOALS ||--o{ GOALS : templates
    SHARED_GOALS ||--o{ SHARED_GOAL_LINKS : links

    GOALS ||--o{ SHARED_GOAL_LINKS : linked_goal
    GOALS ||--o{ GOAL_UPDATES : tracks
    GOALS ||--o{ MANAGER_COMMENTS : discussed_on
```

## Workflow Reading

- `users.manager_id` forms the manager direct-report tree used by RLS scope checks.
- `goal_sheets` are unique per employee and cycle, and state transitions drive submission, approval, locking, and unlock workflows.
- `goals` are the editable KPI rows under a sheet; locking a sheet locks the related goals.
- `shared_goals` and `shared_goal_links` model manager-created KPIs that can cascade to multiple employees while preserving individual weightage.
- `goal_updates` store one quarterly update per goal and quarter.
- `manager_comments`, `cycle_windows`, and `audit_logs` support check-in review, governance windows, and traceability.
