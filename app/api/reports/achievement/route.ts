import { NextResponse } from "next/server";
import { seedData } from "@/lib/demo/seed-data";
import { createAchievementCsv } from "@/lib/domain/rules";
import { loadAlignHqData } from "@/lib/supabase/alignhq-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentAppUser, hasRole } from "@/lib/server/authz";
import { apiError, logApiEvent, parseQuarter } from "@/lib/server/http";
import { validateProductionEnv } from "@/lib/supabase/env";
import type { Quarter } from "@/types/alignhq";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quarterParam = searchParams.get("quarter");
  const quarter = quarterParam ? parseQuarter(quarterParam) : ("Q1" as Quarter);
  if (!quarter) {
    return apiError(400, "invalid_quarter", "Quarter must be one of Q1, Q2, Q3, Q4.");
  }

  const { user } = await resolveCurrentAppUser();
  if (!user) {
    return apiError(401, "unauthorized", "Authentication is required for report export.");
  }
  if (!hasRole(user, ["Admin", "Manager"])) {
    return apiError(403, "forbidden", "Only Manager or Admin users can export achievement reports.");
  }
  const envValidation = validateProductionEnv();
  if (!envValidation.valid) {
    logApiEvent("achievement_report_env_missing", { missing: envValidation.missing });
  }

  logApiEvent("achievement_report_requested", { quarter, actorId: user.id, role: user.role });
  const supabase = await createSupabaseServerClient();
  const data = supabase ? await loadAlignHqData(supabase).catch(() => seedData) : seedData;
  const csv = createAchievementCsv(data.users.length > 0 ? data : seedData, quarter);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="alignhq-achievement-${quarter.toLowerCase()}.csv"`
    }
  });
}
