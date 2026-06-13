import { describe, it, expect } from "vitest";
import {
  cn,
  moodScoreToLabel,
  moodLabelToEmoji,
  averageMoodScore,
  formatDateLabel,
  formatDateShort,
  todayISO,
  daysUntilExam,
  buildMoodTrend,
  sanitizeText,
  stripHtml,
} from "../index";
import type { JournalEntry, MoodScore } from "@/types";

// ---- cn (class merging) ----

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

// ---- moodScoreToLabel ----

describe("moodScoreToLabel", () => {
  it("returns overwhelmed for score 1", () => {
    expect(moodScoreToLabel(1)).toBe("overwhelmed");
  });

  it("returns excellent for score 10", () => {
    expect(moodScoreToLabel(10)).toBe("excellent");
  });

  it("returns neutral for score 4", () => {
    expect(moodScoreToLabel(4)).toBe("neutral");
  });
});

// ---- moodLabelToEmoji ----

describe("moodLabelToEmoji", () => {
  it("returns an emoji string for each label", () => {
    const labels = [
      "overwhelmed",
      "anxious",
      "low",
      "neutral",
      "calm",
      "good",
      "focused",
      "motivated",
      "joyful",
      "excellent",
    ] as const;
    for (const label of labels) {
      const emoji = moodLabelToEmoji(label);
      expect(typeof emoji).toBe("string");
      expect(emoji.length).toBeGreaterThan(0);
    }
  });
});

// ---- averageMoodScore ----

describe("averageMoodScore", () => {
  it("returns 0 for empty array", () => {
    expect(averageMoodScore([])).toBe(0);
  });

  it("returns the single value for a one-element array", () => {
    expect(averageMoodScore([7])).toBe(7);
  });

  it("calculates correct average", () => {
    expect(averageMoodScore([2, 4, 6, 8] as MoodScore[])).toBe(5);
  });
});

// ---- formatDateLabel ----

describe("formatDateLabel", () => {
  it("returns 'Today' for today's ISO date", () => {
    const today = new Date().toISOString().split("T")[0]!;
    expect(formatDateLabel(today)).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday's date", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0]!;
    expect(formatDateLabel(yesterday)).toBe("Yesterday");
  });

  it("returns formatted date for older dates", () => {
    const result = formatDateLabel("2024-01-15");
    expect(result).toBe("Jan 15, 2024");
  });
});

// ---- formatDateShort ----

describe("formatDateShort", () => {
  it("returns abbreviated month and day", () => {
    expect(formatDateShort("2024-06-01")).toBe("Jun 1");
  });
});

// ---- todayISO ----

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---- daysUntilExam ----

describe("daysUntilExam", () => {
  it("returns null when examDate is null", () => {
    expect(daysUntilExam(null)).toBeNull();
  });

  it("returns 0 for past dates (clamps to 0)", () => {
    expect(daysUntilExam("2000-01-01")).toBe(0);
  });

  it("returns positive number for future dates", () => {
    const future = new Date(Date.now() + 10 * 86_400_000).toISOString().split("T")[0]!;
    const days = daysUntilExam(future);
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });
});

// ---- buildMoodTrend ----

describe("buildMoodTrend", () => {
  const entries: JournalEntry[] = [
    {
      id: "1",
      date: "2024-06-03",
      content: "test",
      moodScore: 6,
      moodLabel: "good",
      tags: [],
      analysis: null,
      createdAt: "2024-06-03T10:00:00Z",
      updatedAt: "2024-06-03T10:00:00Z",
    },
    {
      id: "2",
      date: "2024-06-01",
      content: "test2",
      moodScore: 4,
      moodLabel: "neutral",
      tags: [],
      analysis: null,
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: "2024-06-01T10:00:00Z",
    },
  ];

  it("sorts entries by date ascending", () => {
    const trend = buildMoodTrend(entries);
    expect(trend[0]?.date).toBe("2024-06-01");
    expect(trend[1]?.date).toBe("2024-06-03");
  });

  it("maps to MoodTrend shape", () => {
    const trend = buildMoodTrend(entries);
    expect(trend[0]).toEqual({
      date: "2024-06-01",
      moodScore: 4,
      moodLabel: "neutral",
    });
  });
});

// ---- sanitizeText ----

describe("sanitizeText", () => {
  it("escapes HTML special characters", () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("escapes single quotes", () => {
    expect(sanitizeText("it's")).toBe("it&#039;s");
  });

  it("returns unchanged text when no special characters", () => {
    expect(sanitizeText("hello world")).toBe("hello world");
  });
});

// ---- stripHtml ----

describe("stripHtml", () => {
  it("strips HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("returns unchanged string when no tags", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});
