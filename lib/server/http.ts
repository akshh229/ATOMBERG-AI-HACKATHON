import { NextResponse } from "next/server";
import type { Quarter } from "@/types/alignhq";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "unsupported_media_type"
  | "invalid_quarter"
  | "internal_error";

export function apiError(status: number, code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export function apiOk<T extends Record<string, unknown>>(payload: T, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

export function parseQuarter(value: string | null): Quarter | null {
  if (!value) return null;
  return ["Q1", "Q2", "Q3", "Q4"].includes(value) ? (value as Quarter) : null;
}

export function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("application/json");
}

export function getIdempotencyKey(request: Request) {
  const value = request.headers.get("x-idempotency-key")?.trim();
  return value && value.length <= 128 ? value : null;
}

export function logApiEvent(event: string, details: Record<string, unknown> = {}) {
  console.info(`[api] ${event}`, details);
}
