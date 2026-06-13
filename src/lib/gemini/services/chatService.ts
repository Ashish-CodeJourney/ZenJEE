// =============================================================================
// Chat service — manages the conversational AI companion session.
//
// History handling:
//   We pass the full conversation history on every call rather than maintaining
//   server-side session state. This keeps the service stateless (important for
//   Vercel serverless) while letting Gemini have full context.
//   The API route caps history at 20 messages (Zod schema) to bound token cost.
// =============================================================================

import type { ChatMessage, ExamType, MoodScore } from "@/types";
import { getGeminiClient, GEMINI_MODELS } from "@/lib/gemini/client";
import {
  buildChatSystemPrompt,
  convertHistoryToGeminiFormat,
  type ChatUserContext,
} from "@/lib/gemini/prompts/chatCompanion";

export type SendMessageParams = {
  readonly message: string;
  readonly history: readonly Pick<ChatMessage, "role" | "content">[];
  readonly userContext: {
    readonly displayName: string;
    readonly examType: ExamType;
    readonly recentMoodScore?: MoodScore;
  };
};

/**
 * Sends a user message to the Gemini companion and returns the assistant reply.
 * The system prompt is rebuilt per request so context (mood score, exam) stays fresh.
 */
export async function sendChatMessage(params: SendMessageParams): Promise<string> {
  const client = getGeminiClient();
  const systemInstruction = buildChatSystemPrompt(params.userContext as ChatUserContext);

  const model = client.getGenerativeModel({
    model: GEMINI_MODELS.chat,
    systemInstruction,
    generationConfig: {
      temperature: 0.7, // slightly higher than analysis for natural conversational warmth
      maxOutputTokens: 600, // concise replies — students are time-pressed
    },
  });

  const geminiHistory = convertHistoryToGeminiFormat(params.history);
  const chat = model.startChat({ history: geminiHistory });

  const result = await chat.sendMessage(params.message);
  const reply = result.response.text().trim();

  if (!reply) {
    throw new Error("Gemini returned an empty chat response");
  }

  return reply;
}
