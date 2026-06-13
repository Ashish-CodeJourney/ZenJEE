// =============================================================================
// POST /api/analyze-journal
// Accepts a journal entry and returns structured AI analysis.
//
// Security layers applied (in order):
//   1. Rate limiting — prevents runaway Gemini API cost from a single client.
//   2. Zod validation — rejects malformed or oversized input before AI call.
//   3. Server-only — Gemini API key lives only in process.env, never bundled.
// =============================================================================

import { NextResponse } from "next/server";
import { AnalyzeJournalRequestSchema } from "@/lib/validators/schemas";
import { analyseJournal } from "@/lib/gemini/services/journalAnalysisService";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { RateLimitConfig } from "@/lib/validators/schemas";
import type { AnalyzeJournalResponse } from "@/types";

export async function POST(request: Request): Promise<NextResponse<AnalyzeJournalResponse>> {
  // --- Rate limiting ---
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    `analyze:${ip}`,
    RateLimitConfig.analyzeJournal.requests,
    RateLimitConfig.analyzeJournal.windowMs
  );

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
      }
    );
  }

  // --- Input validation ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = AnalyzeJournalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  // --- AI analysis ---
  try {
    const analysis = await analyseJournal({
      content: parsed.data.content,
      moodScore: parsed.data.moodScore,
      date: parsed.data.date,
    });

    return NextResponse.json({ success: true, analysis }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("[analyze-journal]", message);

    // Don't leak internal error details to the client
    return NextResponse.json(
      { success: false, error: "Could not analyse your journal right now. Please try again." },
      { status: 502 }
    );
  }
}
