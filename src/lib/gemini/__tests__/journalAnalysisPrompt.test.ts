import { describe, it, expect } from "vitest";
import { buildJournalAnalysisPrompt } from "../prompts/journalAnalysis";

const BASE_PARAMS = {
  content: "I could not sleep last night thinking about my JEE exam. Integration is killing me.",
  moodScore: 3 as const,
  date: "2024-06-15",
  examType: "JEE" as const,
};

describe("buildJournalAnalysisPrompt", () => {
  it("includes the journal content verbatim", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain(BASE_PARAMS.content);
  });

  it("includes the mood score", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain("3/10");
  });

  it("includes the exam date", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain("2024-06-15");
  });

  it("includes the exam type", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain("JEE");
  });

  it("defaults exam type to 'competitive exam' when not provided", () => {
    const { examType: _examType, ...rest } = BASE_PARAMS;
    const prompt = buildJournalAnalysisPrompt(rest);
    expect(prompt).toContain("competitive exam");
  });

  it("includes the JSON output schema", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain('"sentiment"');
    expect(prompt).toContain('"stressTriggers"');
    expect(prompt).toContain('"copingStrategies"');
    expect(prompt).toContain('"mindfulnessExercise"');
    expect(prompt).toContain('"crisisDetected"');
  });

  it("includes the safety guardrails", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain("NEVER provide medical diagnoses");
    expect(prompt).toContain("crisisDetected");
    expect(prompt).toContain("iCall");
    expect(prompt).toContain("Vandrevala Foundation");
    expect(prompt).toContain("NIMHANS");
  });

  it("instructs Gemini not to use markdown code blocks", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toContain("Do NOT wrap in markdown code blocks");
  });

  it("quotes the journal content between triple-quotes", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(prompt).toMatch(/"""\s[\s\S]*?\s"""/);
  });

  it("is a non-empty string", () => {
    const prompt = buildJournalAnalysisPrompt(BASE_PARAMS);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(500);
  });
});
