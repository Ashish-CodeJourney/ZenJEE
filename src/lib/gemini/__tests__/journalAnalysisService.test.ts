import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyseJournal } from "../services/journalAnalysisService";
import { _resetGeminiClient } from "../client";

// ---------------------------------------------------------------------------
// Mock the Gemini SDK so tests never make real network calls.
// We mock at the module level so the factory function always returns our mock.
// ---------------------------------------------------------------------------

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

const VALID_ANALYSIS_JSON = JSON.stringify({
  sentiment: "negative",
  sentimentIntensity: 0.75,
  stressTriggers: [
    { trigger: "Integration calculus", severity: "high", category: "academic" },
    { trigger: "Sleep deprivation", severity: "moderate", category: "physical" },
  ],
  emotionalPatterns: [
    { pattern: "Catastrophising about exam outcome", frequency: "recurring" },
  ],
  copingStrategies: [
    {
      id: "strategy-1",
      title: "5-4-3-2-1 Grounding",
      description: "Anchor yourself in the present moment.",
      estimatedMinutes: 5,
      category: "mindfulness",
      steps: ["Name 5 things you can see", "Name 4 things you can touch"],
    },
  ],
  mindfulnessExercise: {
    id: "exercise-1",
    title: "Box Breathing",
    description: "Calm your nervous system in 5 minutes.",
    durationMinutes: 5,
    type: "breathing",
    instructions: ["Inhale for 4", "Hold for 4", "Exhale for 4", "Hold for 4"],
  },
  motivationalMessage: "You recognised you're struggling — that takes courage.",
  crisisDetected: false,
  summary: "The student is experiencing high academic stress related to exam preparation.",
});

beforeEach(() => {
  _resetGeminiClient();
  vi.clearAllMocks();
  process.env["GEMINI_API_KEY"] = "test-key";
});

describe("analyseJournal", () => {
  it("returns parsed JournalAnalysis on valid Gemini response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => VALID_ANALYSIS_JSON },
    });

    const result = await analyseJournal({
      content: "I could not sleep — integration calculus is overwhelming me.",
      moodScore: 3,
      date: "2024-06-15",
      examType: "JEE",
    });

    expect(result.sentiment).toBe("negative");
    expect(result.sentimentIntensity).toBe(0.75);
    expect(result.stressTriggers).toHaveLength(2);
    expect(result.stressTriggers[0]?.trigger).toBe("Integration calculus");
    expect(result.copingStrategies).toHaveLength(1);
    expect(result.mindfulnessExercise.title).toBe("Box Breathing");
    expect(result.crisisDetected).toBe(false);
  });

  it("throws when Gemini returns non-JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => "I cannot help with this." },
    });

    await expect(
      analyseJournal({ content: "Test entry for parsing", moodScore: 5, date: "2024-06-15" })
    ).rejects.toThrow("non-JSON");
  });

  it("throws when Gemini returns a non-object JSON value", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '"just a string"' },
    });

    await expect(
      analyseJournal({ content: "Test entry string check", moodScore: 5, date: "2024-06-15" })
    ).rejects.toThrow("not a JSON object");
  });

  it("applies graceful defaults for missing optional fields", async () => {
    const minimalJson = JSON.stringify({
      sentiment: "neutral",
      sentimentIntensity: 0.3,
      // missing stressTriggers, emotionalPatterns, copingStrategies
      mindfulnessExercise: null,
      motivationalMessage: "",
      crisisDetected: false,
      summary: "Brief summary",
    });

    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => minimalJson },
    });

    const result = await analyseJournal({
      content: "Short but valid entry here.",
      moodScore: 5,
      date: "2024-06-15",
    });

    expect(result.stressTriggers).toEqual([]);
    expect(result.emotionalPatterns).toEqual([]);
    expect(result.copingStrategies).toEqual([]);
    // default mindfulness exercise applied when field is null
    expect(result.mindfulnessExercise.title).toBe("Box Breathing");
    expect(result.motivationalMessage).toBe("Keep going — you are doing great.");
  });

  it("falls back to 'neutral' for unrecognised sentiment values", async () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_ANALYSIS_JSON), sentiment: "unknown_val" });
    mockGenerateContent.mockResolvedValueOnce({ response: { text: () => json } });

    const result = await analyseJournal({
      content: "Entry with unrecognised sentiment response.",
      moodScore: 5,
      date: "2024-06-15",
    });
    expect(result.sentiment).toBe("neutral");
  });

  it("clamps sentimentIntensity to [0, 1]", async () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_ANALYSIS_JSON), sentimentIntensity: 99 });
    mockGenerateContent.mockResolvedValueOnce({ response: { text: () => json } });

    const result = await analyseJournal({
      content: "Entry with out-of-range intensity value.",
      moodScore: 5,
      date: "2024-06-15",
    });
    expect(result.sentimentIntensity).toBe(1);
  });

  it("sets crisisDetected to true when Gemini signals crisis", async () => {
    const crisisJson = JSON.stringify({
      ...JSON.parse(VALID_ANALYSIS_JSON),
      crisisDetected: true,
      motivationalMessage:
        "I am deeply concerned. Please reach out: iCall – 9152987821",
    });
    mockGenerateContent.mockResolvedValueOnce({ response: { text: () => crisisJson } });

    const result = await analyseJournal({
      content: "I do not want to exist anymore. Everything is pointless.",
      moodScore: 1,
      date: "2024-06-15",
    });
    expect(result.crisisDetected).toBe(true);
  });

  it("throws when GEMINI_API_KEY is not set", async () => {
    delete process.env["GEMINI_API_KEY"];
    _resetGeminiClient();

    await expect(
      analyseJournal({ content: "Valid test entry here.", moodScore: 5, date: "2024-06-15" })
    ).rejects.toThrow("GEMINI_API_KEY");
  });

  it("caps stressTriggers to 6 entries", async () => {
    const manyTriggers = Array.from({ length: 10 }, (_, i) => ({
      trigger: `Trigger ${i}`,
      severity: "mild",
      category: "academic",
    }));
    const json = JSON.stringify({ ...JSON.parse(VALID_ANALYSIS_JSON), stressTriggers: manyTriggers });
    mockGenerateContent.mockResolvedValueOnce({ response: { text: () => json } });

    const result = await analyseJournal({
      content: "Entry with many triggers to test cap.",
      moodScore: 5,
      date: "2024-06-15",
    });
    expect(result.stressTriggers.length).toBeLessThanOrEqual(6);
  });
});
