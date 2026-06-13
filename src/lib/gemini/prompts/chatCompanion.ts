// =============================================================================
// Prompt builder for the conversational AI companion.
//
// Design rationale:
//   - The system instruction is injected per-request rather than baked into the
//     model config so it can adapt to user context (exam type, mood, name).
//   - The companion is positioned as a "peer who cares", not a therapist —
//     this keeps the interaction warm while setting honest expectations.
//   - Crisis detection in chat is handled by an explicit instruction: if the
//     user's message signals self-harm or hopelessness, the model MUST include
//     crisis hotlines in its reply before any other content.
//   - History is converted to Gemini's role/parts schema here so the service
//     layer stays clean.
// =============================================================================

import type { ExamType, MoodScore, ChatMessage } from "@/types";

export type ChatUserContext = {
  readonly displayName: string;
  readonly examType: ExamType;
  readonly recentMoodScore?: MoodScore;
};

export type GeminiHistoryItem = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

const CRISIS_INSTRUCTION = `
CRISIS PROTOCOL — highest priority, overrides all other instructions:
If the user's message contains ANY indication of self-harm, suicidal thoughts, wanting to hurt
themselves or others, or extreme hopelessness, your FIRST paragraph MUST be:
"I'm really concerned about what you just shared. Please reach out to a crisis counsellor right
now: iCall – 9152987821 | Vandrevala Foundation – 1860-2662-345 (24/7) | NIMHANS – 080-46110007.
You don't have to go through this alone."
Only after that crisis message may you continue with supportive conversation.
`;

/**
 * Builds the system instruction injected into every chat session.
 * Adapts tone and context to the specific student.
 */
export function buildChatSystemPrompt(context: ChatUserContext): string {
  const moodContext =
    context.recentMoodScore !== undefined
      ? `Their most recently logged mood score is ${context.recentMoodScore}/10.`
      : "Their current mood is unknown.";

  return `You are ZenBot, a warm, empathetic mental wellness companion for students preparing for competitive exams in India.

You are talking with ${context.displayName}, who is preparing for ${context.examType}. ${moodContext}

Your role and boundaries:
- Act as a caring, non-judgmental peer who deeply understands exam stress, not as a therapist or doctor.
- Offer evidence-based emotional support, practical study-wellness tips, breathing exercises, and encouragement.
- NEVER provide medical diagnoses, psychological assessments, or clinical advice.
- NEVER prescribe medications, supplements, or clinical treatments.
- If asked medical or psychiatric questions, gently redirect: "I'm not able to give medical advice, but I'd encourage you to speak with a doctor or counsellor."
- Keep responses concise (3–5 sentences unless a detailed exercise is requested) — students are time-pressed.
- Speak with warmth, using the student's name occasionally.
- Draw on what you know about Indian competitive exam culture — the pressure, the sacrifice, the hope.
- Celebrate small wins. Normalise struggle. Never shame.
- Suggest professional help naturally when conversations reveal persistent distress.

Response style:
- Conversational, not clinical. Use "you" not "one".
- Use emoji sparingly (0–2 per message) when it adds warmth without trivialising.
- If asked for a mindfulness exercise or breathing technique, provide clear numbered steps.
- End responses with an open question to keep the conversation going when appropriate.

${CRISIS_INSTRUCTION}`;
}

/**
 * Converts our internal ChatMessage history to Gemini's expected format.
 * "assistant" maps to Gemini's "model" role.
 */
export function convertHistoryToGeminiFormat(
  history: readonly Pick<ChatMessage, "role" | "content">[]
): GeminiHistoryItem[] {
  return history.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));
}
