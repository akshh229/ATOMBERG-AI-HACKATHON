import { seedData } from "@/lib/demo/seed-data";
import { buildEscalationItems } from "@/lib/domain/escalations";
import { loadAlignHqData } from "@/lib/supabase/alignhq-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/integrations/dispatch";
import { buildNotificationPreviews } from "@/lib/integrations/notifications";
import { resolveCurrentAppUser, hasRole } from "@/lib/server/authz";
import { readIdempotentResult, writeIdempotentResult } from "@/lib/server/idempotency";
import { apiError, apiOk, getIdempotencyKey, isJsonRequest, logApiEvent, parseQuarter } from "@/lib/server/http";
import { validateProductionEnv } from "@/lib/supabase/env";
import type { Quarter } from "@/types/alignhq";

function originAllowlist() {
  return (process.env.ALIGNHQ_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return apiError(415, "unsupported_media_type", "Request content-type must be application/json.");
  }

  const { user } = await resolveCurrentAppUser();
  if (!user) {
    return apiError(401, "unauthorized", "Authentication is required for escalation dispatch.");
  }
  if (!hasRole(user, ["Admin"])) {
    return apiError(403, "forbidden", "Only Admin users can dispatch escalations.");
  }
  const envValidation = validateProductionEnv();
  if (!envValidation.valid) {
    logApiEvent("dispatch_escalations_env_missing", { missing: envValidation.missing });
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (idempotencyKey) {
    const cached = readIdempotentResult<Record<string, unknown>>(idempotencyKey);
    if (cached) {
      return apiOk({ ...cached, deduped: true });
    }
  }

  const body = (await request.json().catch(() => null)) as { quarter?: string; origin?: string } | null;
  if (!body) {
    return apiError(400, "bad_request", "Malformed JSON request body.");
  }

  const quarter = body.quarter ? parseQuarter(body.quarter) : ("Q1" as Quarter);
  if (!quarter) {
    return apiError(400, "invalid_quarter", "Quarter must be one of Q1, Q2, Q3, Q4.");
  }

  const supabase = await createSupabaseServerClient();
  const data = supabase ? await loadAlignHqData(supabase).catch(() => seedData) : seedData;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "https://alignhq.example.com";
  const requestedOrigin = body.origin?.trim();
  const allowedOrigins = originAllowlist();
  const origin = requestedOrigin?.startsWith("http") ? requestedOrigin : appOrigin;
  if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return apiError(400, "bad_request", "Origin is not allowed for dispatch deep links.");
  }
  const escalations = buildEscalationItems(data.users.length > 0 ? data : seedData, quarter);
  const notifications = buildNotificationPreviews(escalations, origin);
  const results = await Promise.all(notifications.map(dispatchNotification));

  const payload = {
    quarter,
    escalations: escalations.length,
    notifications: notifications.length,
    sent: results.filter((item) => item.status === "sent").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    results
  };

  if (idempotencyKey) {
    writeIdempotentResult(idempotencyKey, payload);
  }

  logApiEvent("dispatch_escalations_completed", {
    actorId: user.id,
    role: user.role,
    quarter,
    escalations: payload.escalations,
    notifications: payload.notifications,
    sent: payload.sent,
    skipped: payload.skipped,
    failed: payload.failed
  });

  return apiOk(payload);
}
