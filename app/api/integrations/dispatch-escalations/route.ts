import { NextResponse } from "next/server";
import { seedData } from "@/lib/demo/seed-data";
import { buildEscalationItems } from "@/lib/domain/escalations";
import { loadAlignHqData } from "@/lib/supabase/alignhq-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/integrations/dispatch";
import { buildNotificationPreviews } from "@/lib/integrations/notifications";
import type { Quarter } from "@/types/alignhq";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { quarter?: Quarter; origin?: string };
  const quarter = body.quarter ?? "Q1";
  const supabase = await createSupabaseServerClient();
  const data = supabase ? await loadAlignHqData(supabase).catch(() => seedData) : seedData;
  const origin = body.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://alignhq.example.com";
  const escalations = buildEscalationItems(data.users.length > 0 ? data : seedData, quarter);
  const notifications = buildNotificationPreviews(escalations, origin);
  const results = await Promise.all(notifications.map(dispatchNotification));

  return NextResponse.json({
    quarter,
    escalations: escalations.length,
    notifications: notifications.length,
    sent: results.filter((item) => item.status === "sent").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
    results
  });
}
