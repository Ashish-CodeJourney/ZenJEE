import { describe, it, expect } from "vitest";
import {
  AnalyzeJournalRequestSchema,
  ChatRequestSchema,
  UserProfileSchema,
  MoodScoreSchema,
  ISODateSchema,
} from "../schemas";

describe("MoodScoreSchema", () => {
  it("accepts integers 1–10", () => {
    for (let i = 1; i <= 10; i++) {
      expect(MoodScoreSchema.safeParse(i).success).toBe(true);
    }
  });

  it("rejects 0 and 11", () => {
    expect(MoodScoreSchema.safeParse(0).success).toBe(false);
    expect(MoodScoreSchema.safeParse(11).success).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(MoodScoreSchema.safeParse(5.5).success).toBe(false);
  });
});

describe("ISODateSchema", () => {
  it("accepts YYYY-MM-DD format", () => {
    expect(ISODateSchema.safeParse("2024-06-15").success).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(ISODateSchema.safeParse("15-06-2024").success).toBe(false);
    expect(ISODateSchema.safeParse("2024/06/15").success).toBe(false);
    expect(ISODateSchema.safeParse("not a date").success).toBe(false);
  });
});

describe("AnalyzeJournalRequestSchema", () => {
  const valid = {
    content: "Today was really stressful because I could not solve integration problems.",
    moodScore: 3,
    date: "2024-06-15",
  };

  it("accepts valid input", () => {
    expect(AnalyzeJournalRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects content shorter than 10 characters", () => {
    const result = AnalyzeJournalRequestSchema.safeParse({ ...valid, content: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects content longer than 5000 characters", () => {
    const result = AnalyzeJournalRequestSchema.safeParse({
      ...valid,
      content: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from content", () => {
    const result = AnalyzeJournalRequestSchema.safeParse({
      ...valid,
      content: "  Today was stressful with exam pressure  ",
    });
    if (result.success) {
      expect(result.data.content).not.toMatch(/^\s|\s$/);
    }
  });
});

describe("ChatRequestSchema", () => {
  const valid = {
    message: "I am feeling overwhelmed today",
    history: [],
    userContext: { displayName: "Priya", examType: "NEET", recentMoodScore: 4 },
  };

  it("accepts valid input", () => {
    expect(ChatRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(ChatRequestSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects message over 1000 characters", () => {
    expect(
      ChatRequestSchema.safeParse({ ...valid, message: "a".repeat(1001) }).success
    ).toBe(false);
  });

  it("rejects history over 20 items", () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: "user" as const,
      content: `msg ${i}`,
    }));
    expect(ChatRequestSchema.safeParse({ ...valid, history }).success).toBe(false);
  });

  it("rejects invalid examType", () => {
    const result = ChatRequestSchema.safeParse({
      ...valid,
      userContext: { ...valid.userContext, examType: "INVALID" },
    });
    expect(result.success).toBe(false);
  });
});

describe("UserProfileSchema", () => {
  it("accepts valid profile with null examDate", () => {
    const result = UserProfileSchema.safeParse({
      displayName: "Rahul",
      examType: "JEE",
      examDate: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid examTypes", () => {
    const types = ["JEE", "NEET", "CUET", "CAT", "GATE", "UPSC", "OTHER"] as const;
    for (const t of types) {
      expect(
        UserProfileSchema.safeParse({ displayName: "X", examType: t, examDate: null }).success
      ).toBe(true);
    }
  });

  it("rejects empty displayName", () => {
    expect(
      UserProfileSchema.safeParse({ displayName: "", examType: "JEE", examDate: null }).success
    ).toBe(false);
  });
});
