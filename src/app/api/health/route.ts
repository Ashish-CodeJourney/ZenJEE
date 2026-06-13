import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/gemini/healthCheck";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  const status = checkHealth();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
