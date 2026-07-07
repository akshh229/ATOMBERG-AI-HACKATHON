# AlignHQ Operations Guide

## Runtime modes

- **Local demo mode**: set `NEXT_PUBLIC_ALIGNHQ_FORCE_LOCAL_DEMO=true` (or `localStorage.alignhq-force-local-demo=true`) to use deterministic local data without Supabase.
- **Supabase mode**: provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Demo auth credentials

- Set `ALIGNHQ_DEMO_PASSWORD` for `npm run supabase:seed-auth`.
- Set matching `NEXT_PUBLIC_ALIGNHQ_DEMO_PASSWORD` for role-launcher sign-in buttons.
- Never commit demo passwords in source-controlled files.

## Dispatch security baseline

- `TEAMS_WEBHOOK_ALLOWLIST` and `EMAIL_WEBHOOK_ALLOWLIST` restrict outbound webhook hostnames.
- `WEBHOOK_HMAC_SECRET` enables `x-alignhq-signature` on webhook payloads.
- `DISPATCH_MAX_RETRIES` controls retry/backoff attempts for retryable failures.
- `ALIGNHQ_ALLOWED_ORIGINS` restricts deep-link origin values accepted by dispatch API.

## Troubleshooting

### Supabase auth users are not linked to app profiles

1. Verify `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`).
2. Ensure `ALIGNHQ_DEMO_PASSWORD` is set.
3. Run `npm run supabase:seed-auth`.
4. Confirm `public.users.auth_user_id` is populated for seeded users.

### Entra org sync fails

1. Check `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`.
2. Check group IDs (`ENTRA_EMPLOYEE_GROUP_ID`, `ENTRA_MANAGER_GROUP_ID`, `ENTRA_ADMIN_GROUP_ID`).
3. Re-run `npm run entra:sync-org` and inspect script output for missing Graph permissions.

## Incident-response basics

- Disable webhook URLs if dispatch traffic is suspicious.
- Rotate `WEBHOOK_HMAC_SECRET` and `EMAIL_WEBHOOK_TOKEN` after suspected compromise.
- Restrict `ALIGNHQ_ALLOWED_ORIGINS` and webhook allowlists to trusted hosts only.
