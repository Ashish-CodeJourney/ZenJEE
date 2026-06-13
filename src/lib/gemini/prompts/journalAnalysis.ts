// =============================================================================
// Prompt builder for journal analysis.
//
// Design rationale:
//   - Structured output schema is embedded in the prompt so Gemini knows exactly
//     what JSON shape to return. Combined with responseMimeType:"application/json"
//     this gives near-deterministic structure without an extra parsing layer.
//   - Safety guardrails are explicit and non-negotiable in the prompt text.
//     An LLM that ignores them would be caught by the crisisDetected flag which
//     the frontend always checks and surfaces crisis hotlines on true.
//   - We include the exam type so coping strategies are contextualised
//     (e.g., NEET biology overload vs JEE maths anxiety differ meaningfully).
// =============================================================================

import type { ExamType, MoodScore } from "@/types";

export type JournalAnalysisPromptParams = {
  readonly content: string;
  readonly moodScore: MoodScore;
  readonly date: string;
  readonly examType?: ExamType;
};

/** The JSON schema description embedded in the prompt. */
const OUTPUT_SCHEMA = `{
  "sentiment": "negative" | "neutral" | "positive",
  "sentimentIntensity": number between 0.0 and 1.0,
  "stressTriggers": [
    {
      "trigger": "specific trigger identified from the text",
      "severity": "mild" | "moderate" | "high",
      "category": "academic" | "social" | "self-doubt" | "physical" | "family" | "time-management" | "other"
    }
  ],
  "emotionalPatterns": [
    {
      "pattern": "observed emotional pattern",
      "frequency": "occasional" | "recurring" | "persistent"
    }
  ],
  "copingStrategies": [
    {
      "id": "strategy-1",
      "title": "Strategy title",
      "description": "One sentence description",
      "estimatedMinutes": number,
      "category": "breathing" | "mindfulness" | "physical" | "cognitive" | "social" | "creative",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "mindfulnessExercise": {
    "id": "exercise-1",
    "title": "Exercise title",
    "description": "One sentence description",
    "durationMinutes": number,
    "type": "breathing" | "meditation" | "grounding" | "visualization" | "movement",
    "instructions": ["Instruction 1", "Instruction 2", "Instruction 3", "Instruction 4"]
  },
  "motivationalMessage": "Warm, personalised 2–3 sentence message directly addressing the student",
  "crisisDetected": boolean,
  "summary": "2–3 sentence summary of emotional state and key themes"
}`;

const SAFETY_GUARDRAILS = `
ABSOLUTE SAFETY RULES — these override everything else:
1. NEVER provide medical diagnoses, psychiatric labels, or treatment prescriptions.
2. NEVER suggest medication or clinical interventions.
3. If the journal text contains ANY mention of self-harm, suicidal thoughts, wanting to die, or
   severe hopelessness, you MUST set crisisDetected to true AND include this exact text in
   motivationalMessage alongside your supportive message:
   "If you are in crisis, please reach out immediately: iCall – 9152987821 |
    Vandrevala Foundation – 1860-2662-345 (24/7) | NIMHANS – 080-46110007"
4. Keep all guidance within peer-support wellness scope, not therapy.
5. Be culturally sensitive to the Indian academic context: family pressure, social comparison,
   financial sacrifice, societal expectations around competitive exams are real stressors.
6. NEVER dismiss or minimise the student's feelings.
`;

/**
 * Builds the full prompt string sent to Gemini for journal analysis.
 * Pure function — easily unit-tested without any SDK involvement.
 */
export function buildJournalAnalysisPrompt(params: JournalAnalysisPromptParams): string {
  const { content, moodScore, date, examType = "competitive exam" } = params;

  return `You are a compassionate mental wellness analyst specialising in supporting Indian students preparing for high-stakes competitive exams (JEE, NEET, CUET, CAT, GATE, UPSC).

Analyse the journal entry below and return ONLY a valid JSON object. Do NOT wrap in markdown code blocks. Do NOT include any text before or after the JSON.

Context:
- Student is preparing for: ${examType}
- Entry date: ${date}
- Self-reported mood score: ${moodScore}/10 (1 = overwhelmed, 10 = excellent)

Journal entry:
"""
${content}
"""

Return JSON matching this exact schema:
${OUTPUT_SCHEMA}

Guidelines for quality output:
- Extract 1–4 stress triggers actually evidenced in the text (not guessed).
- Identify 1–2 emotional patterns (e.g., catastrophising, perfectionism, comparison anxiety).
- Provide 2–3 coping strategies tailored to a student who likely has 15–30 free minutes.
- The mindfulness exercise should be immediately actionable (no equipment, no quiet room required if possible).
- The motivational message must feel personal, not generic — reference something specific from the entry.
- sentimentIntensity: 0.0 = barely negative/positive, 1.0 = extremely intense.

${SAFETY_GUARDRAILS}`;
}
