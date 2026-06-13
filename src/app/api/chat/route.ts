// =============================================================================
// POST /api/chat
// Accepts a user message + history and returns the companion's reply.
//
// Higher rate limit than analyze-journal (30 vs 10/min) because chat turns are
// shorter and real-time interaction requires lower latency tolerances.
// =============================================================================

import { NextResponse } from "next/server";
import { ChatRequestSchema, RateLimitConfig } from "@/lib/validators/schemas";
import { sendChatMessage } from "@/lib/gemini/services/chatService";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { ChatResponse } from "@/types";

export async function POST(request: Request): Promise<NextResponse<ChatResponse>> {
  // --- Rate limiting ---
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(
    `chat:${ip}`,
    RateLimitConfig.chat.requests,
    RateLimitConfig.chat.windowMs
  );

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Slow down — too many messages. Take a breath and try again." },
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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  // --- Chat ---
  try {
    // Conditional spread avoids exactOptionalPropertyTypes clash between
    // Zod's `T | undefined` and our readonly optional property signature.
    const { displayName, examType, recentMoodScore } = parsed.data.userContext;
    const reply = await sendChatMessage({
      message: parsed.data.message,
      history: parsed.data.history,
      userContext: {
        displayName,
        examType,
        ...(recentMoodScore !== undefined ? { recentMoodScore } : {}),
      },
    });

    return NextResponse.json({ success: true, reply }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[chat]", message);

    return NextResponse.json(
      {
        success: false,
        error: "Your companion is unavailable right now. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
