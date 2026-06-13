// =============================================================================
// Journal analysis service — calls Gemini and parses the structured response.
//
// Error strategy:
//   - If Gemini returns unparseable JSON we throw so the API route can return
//     a 502 rather than silently storing corrupt analysis data.
//   - Individual field parsing is lenient: missing optional arrays default to []
//     so a partially degraded response is still useful to the user.
// =============================================================================

import type { JournalAnalysis, ExamType, MoodScore } from "@/types";
import { getGeminiClient, GEMINI_MODELS } from "@/lib/gemini/client";
import { buildJournalAnalysisPrompt } from "@/lib/gemini/prompts/journalAnalysis";

export type AnalyseJournalParams = {
  readonly content: string;
  readonly moodScore: MoodScore;
  readonly date: string;
  readonly examType?: ExamType;
};

/**
 * Sends a journal entry to Gemini and returns a structured JournalAnalysis.
 * Uses JSON response mode for deterministic parsing.
 */
export async function analyseJournal(params: AnalyseJournalParams): Promise<JournalAnalysis> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODELS.analysis,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const prompt = buildJournalAnalysisPrompt(params);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  return parseAnalysisResponse(raw);
}

// -----------------------------------------------------------------------------
// Response parsing — validates Gemini's JSON against our domain types.
// We deliberately avoid using Zod here to keep the parse path fast and to
// allow graceful field-level fallbacks without throwing on minor deviations.
// -----------------------------------------------------------------------------

function parseAnalysisResponse(raw: string): JournalAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned non-JSON for journal analysis. Raw: ${raw.slice(0, 200)}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Gemini analysis response is not a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  return {
    sentiment: parseSentiment(obj["sentiment"]),
    sentimentIntensity: parseClampedFloat(obj["sentimentIntensity"], 0.5),
    stressTriggers: parseStressTriggers(obj["stressTriggers"]),
    emotionalPatterns: parseEmotionalPatterns(obj["emotionalPatterns"]),
    copingStrategies: parseCopingStrategies(obj["copingStrategies"]),
    mindfulnessExercise: parseMindfulnessExercise(obj["mindfulnessExercise"]),
    motivationalMessage: parseString(obj["motivationalMessage"], "Keep going — you are doing great."),
    crisisDetected: parseBoolean(obj["crisisDetected"]),
    summary: parseString(obj["summary"], ""),
  };
}

function parseLiteral<T extends string>(raw: unknown, valid: readonly T[], fallback: T): T {
  if (typeof raw === "string" && (valid as readonly string[]).includes(raw)) {
    return raw as T;
  }
  return fallback;
}

function parseSentiment(raw: unknown): JournalAnalysis["sentiment"] {
  return parseLiteral(raw, ["negative", "neutral", "positive"] as const, "neutral");
}

function parseClampedFloat(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (isNaN(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function parseBoolean(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === "true") return true;
  return false;
}

function parseString(raw: unknown, fallback: string): string {
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : fallback;
}

const SEVERITY_VALUES = ["mild", "moderate", "high"] as const;
const TRIGGER_CATEGORY_VALUES = ["academic", "social", "self-doubt", "physical", "family", "time-management", "other"] as const;
const FREQUENCY_VALUES = ["occasional", "recurring", "persistent"] as const;
const COPING_CATEGORY_VALUES = ["breathing", "mindfulness", "physical", "cognitive", "social", "creative"] as const;
const MINDFULNESS_TYPE_VALUES = ["breathing", "meditation", "grounding", "visualization", "movement"] as const;

function parseStressTriggers(raw: unknown): JournalAnalysis["stressTriggers"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      trigger: parseString(item["trigger"], "Unknown trigger"),
      severity: parseLiteral(item["severity"], SEVERITY_VALUES, "moderate"),
      category: parseLiteral(item["category"], TRIGGER_CATEGORY_VALUES, "other"),
    }))
    .slice(0, 6);
}

function parseEmotionalPatterns(raw: unknown): JournalAnalysis["emotionalPatterns"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      pattern: parseString(item["pattern"], "Unknown pattern"),
      frequency: parseLiteral(item["frequency"], FREQUENCY_VALUES, "occasional"),
    }))
    .slice(0, 4);
}

function parseCopingStrategies(raw: unknown): JournalAnalysis["copingStrategies"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, i) => ({
      id: parseString(item["id"], `strategy-${i + 1}`),
      title: parseString(item["title"], "Take a break"),
      description: parseString(item["description"], ""),
      estimatedMinutes: parsePositiveInt(item["estimatedMinutes"], 10),
      category: parseLiteral(item["category"], COPING_CATEGORY_VALUES, "mindfulness"),
      steps: parseStringArray(item["steps"]),
    }))
    .slice(0, 4);
}

function parseMindfulnessExercise(raw: unknown): JournalAnalysis["mindfulnessExercise"] {
  if (typeof raw !== "object" || raw === null) {
    return defaultMindfulnessExercise();
  }
  const obj = raw as Record<string, unknown>;
  return {
    id: parseString(obj["id"], "exercise-1"),
    title: parseString(obj["title"], "Box Breathing"),
    description: parseString(obj["description"], "A calming breathing technique"),
    durationMinutes: parsePositiveInt(obj["durationMinutes"], 5),
    type: parseLiteral(obj["type"], MINDFULNESS_TYPE_VALUES, "breathing"),
    instructions: parseStringArray(obj["instructions"]),
  };
}

function parsePositiveInt(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? Math.round(raw) : parseInt(String(raw), 10);
  return isNaN(n) || n <= 0 ? fallback : n;
}

function parseStringArray(raw: unknown): readonly string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

function defaultMindfulnessExercise(): JournalAnalysis["mindfulnessExercise"] {
  return {
    id: "box-breathing",
    title: "Box Breathing",
    description: "A simple 4-4-4-4 breathing pattern to calm your nervous system instantly.",
    durationMinutes: 5,
    type: "breathing",
    instructions: [
      "Sit comfortably with your back straight.",
      "Inhale slowly through your nose for 4 counts.",
      "Hold your breath for 4 counts.",
      "Exhale slowly through your mouth for 4 counts.",
      "Hold empty for 4 counts.",
      "Repeat 4–6 times.",
    ],
  };
}
