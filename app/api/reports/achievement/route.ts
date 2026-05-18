import { NextResponse } from "next/server";
import { seedData } from "@/lib/demo/seed-data";
import { createAchievementCsv } from "@/lib/domain/rules";
import type { Quarter } from "@/types/alignhq";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quarter = (searchParams.get("quarter") ?? "Q1") as Quarter;
  const csv = createAchievementCsv(seedData, quarter);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="alignhq-achievement-${quarter.toLowerCase()}.csv"`
    }
  });
}
