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
      temperature: 0.4, // lower temp = more consistent structured output
      maxOutputTokens: 1500,
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

function parseSentiment(raw: unknown): JournalAnalysis["sentiment"] {
  if (raw === "negative" || raw === "neutral" || raw === "positive") return raw;
  return "neutral";
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

function parseStressTriggers(raw: unknown): JournalAnalysis["stressTriggers"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      trigger: parseString(item["trigger"], "Unknown trigger"),
      severity: parseSeverity(item["severity"]),
      category: parseTriggerCategory(item["category"]),
    }))
    .slice(0, 6); // cap to prevent runaway output
}

function parseSeverity(raw: unknown): "mild" | "moderate" | "high" {
  if (raw === "mild" || raw === "moderate" || raw === "high") return raw;
  return "moderate";
}

function parseTriggerCategory(raw: unknown): "academic" | "social" | "self-doubt" | "physical" | "family" | "time-management" | "other" {
  const valid = ["academic", "social", "self-doubt", "physical", "family", "time-management", "other"] as const;
  if (typeof raw === "string" && (valid as readonly string[]).includes(raw)) {
    return raw as typeof valid[number];
  }
  return "other";
}

function parseEmotionalPatterns(raw: unknown): JournalAnalysis["emotionalPatterns"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      pattern: parseString(item["pattern"], "Unknown pattern"),
      frequency: parseFrequency(item["frequency"]),
    }))
    .slice(0, 4);
}

function parseFrequency(raw: unknown): "occasional" | "recurring" | "persistent" {
  if (raw === "occasional" || raw === "recurring" || raw === "persistent") return raw;
  return "occasional";
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
      category: parseCopingCategory(item["category"]),
      steps: parseStringArray(item["steps"]),
    }))
    .slice(0, 4);
}

function parseCopingCategory(raw: unknown): "breathing" | "mindfulness" | "physical" | "cognitive" | "social" | "creative" {
  const valid = ["breathing", "mindfulness", "physical", "cognitive", "social", "creative"] as const;
  if (typeof raw === "string" && (valid as readonly string[]).includes(raw)) {
    return raw as typeof valid[number];
  }
  return "mindfulness";
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
    type: parseMindfulnessType(obj["type"]),
    instructions: parseStringArray(obj["instructions"]),
  };
}

function parseMindfulnessType(raw: unknown): "breathing" | "meditation" | "grounding" | "visualization" | "movement" {
  const valid = ["breathing", "meditation", "grounding", "visualization", "movement"] as const;
  if (typeof raw === "string" && (valid as readonly string[]).includes(raw)) {
    return raw as typeof valid[number];
  }
  return "breathing";
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
