import { describe, it, expect } from "vitest";
import {
  buildChatSystemPrompt,
  convertHistoryToGeminiFormat,
} from "../prompts/chatCompanion";

describe("buildChatSystemPrompt", () => {
  it("includes the student's name", () => {
    const prompt = buildChatSystemPrompt({
      displayName: "Priya",
      examType: "NEET",
    });
    expect(prompt).toContain("Priya");
  });

  it("includes the exam type", () => {
    const prompt = buildChatSystemPrompt({
      displayName: "Priya",
      examType: "NEET",
    });
    expect(prompt).toContain("NEET");
  });

  it("includes the mood score when provided", () => {
    const prompt = buildChatSystemPrompt({
      displayName: "Priya",
      examType: "NEET",
      recentMoodScore: 4,
    });
    expect(prompt).toContain("4/10");
  });

  it("says mood unknown when not provided", () => {
    const prompt = buildChatSystemPrompt({ displayName: "Rahul", examType: "JEE" });
    expect(prompt).toContain("unknown");
  });

  it("includes the crisis protocol with hotlines", () => {
    const prompt = buildChatSystemPrompt({ displayName: "Rahul", examType: "JEE" });
    expect(prompt).toContain("iCall");
    expect(prompt).toContain("Vandrevala Foundation");
    expect(prompt).toContain("NIMHANS");
  });

  it("prohibits medical diagnoses", () => {
    const prompt = buildChatSystemPrompt({ displayName: "Rahul", examType: "JEE" });
    expect(prompt).toContain("NEVER provide medical diagnoses");
  });

  it("positions ZenBot as a peer companion, not therapist", () => {
    const prompt = buildChatSystemPrompt({ displayName: "Rahul", examType: "JEE" });
    expect(prompt).toContain("ZenBot");
    expect(prompt).toContain("not as a therapist");
  });

  it("instructs concise responses for time-pressed students", () => {
    const prompt = buildChatSystemPrompt({ displayName: "Rahul", examType: "JEE" });
    expect(prompt).toContain("3–5 sentences");
  });
});

describe("convertHistoryToGeminiFormat", () => {
  it("converts 'user' role to 'user'", () => {
    const history = [{ role: "user" as const, content: "Hello" }];
    const result = convertHistoryToGeminiFormat(history);
    expect(result[0]?.role).toBe("user");
  });

  it("converts 'assistant' role to 'model'", () => {
    const history = [{ role: "assistant" as const, content: "Hi there!" }];
    const result = convertHistoryToGeminiFormat(history);
    expect(result[0]?.role).toBe("model");
  });

  it("wraps content in parts array format", () => {
    const history = [{ role: "user" as const, content: "How are you?" }];
    const result = convertHistoryToGeminiFormat(history);
    expect(result[0]?.parts[0]?.text).toBe("How are you?");
  });

  it("preserves order of multi-turn history", () => {
    const history = [
      { role: "user" as const, content: "msg1" },
      { role: "assistant" as const, content: "reply1" },
      { role: "user" as const, content: "msg2" },
    ];
    const result = convertHistoryToGeminiFormat(history);
    expect(result).toHaveLength(3);
    expect(result[0]?.role).toBe("user");
    expect(result[1]?.role).toBe("model");
    expect(result[2]?.role).toBe("user");
  });

  it("returns empty array for empty history", () => {
    expect(convertHistoryToGeminiFormat([])).toEqual([]);
  });
});
