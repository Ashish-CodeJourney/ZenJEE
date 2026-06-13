// =============================================================================
// End-to-end smoke tests — validate full request → validation → service → response
// contracts across both API routes without making real Gemini calls.
//
// These sit at the integration layer: real HTTP Request objects, real Zod
// validation, real rate-limiter logic, mocked AI service only.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoist mocks before module imports
// ---------------------------------------------------------------------------

const { mockAnalyseJournal, mockSendChatMessage } = vi.hoisted(() => ({
  mockAnalyseJournal: vi.fn(),
  mockSendChatMessage: vi.fn(),
}));

vi.mock("@/lib/gemini/services/journalAnalysisService", () => ({
  analyseJournal: mockAnalyseJournal,
}));

vi.mock("@/lib/gemini/services/chatService", () => ({
  sendChatMessage: mockSendChatMessage,
}));

import { POST as analyzePost } from "../analyze-journal/route";
import { POST as chatPost } from "../chat/route";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ANALYSIS = {
  sentiment: "negative" as const,
  sentimentIntensity: 0.7,
  stressTriggers: [{ trigger: "Exam pressure", severity: "high" as const, category: "academic" as const }],
  emotionalPatterns: [],
  copingStrategies: [],
  mindfulnessExercise: {
    id: "e1", title: "Box Breathing", description: "desc",
    durationMinutes: 5, type: "breathing" as const, instructions: [],
  },
  motivationalMessage: "Keep going.",
  crisisDetected: false,
  summary: "High academic stress detected.",
};

function analyzeRequest(body: unknown, ip = `smoke-${Math.random()}`) {
  return new Request("http://localhost/api/analyze-journal", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function chatRequest(body: unknown, ip = `smoke-${Math.random()}`) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// Smoke tests
// ---------------------------------------------------------------------------

describe("E2E smoke — POST /api/analyze-journal", () => {
  it("full happy-path: valid request → 200 with analysis", async () => {
    mockAnalyseJournal.mockResolvedValueOnce(MOCK_ANALYSIS);

    const res = await analyzePost(
      analyzeRequest({
        content: "I am really stressed about tomorrow's JEE paper.",
        moodScore: 3,
        date: "2024-06-15",
      })
    );

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analysis.crisisDetected).toBe(false);
    expect(body.analysis.stressTriggers[0].trigger).toBe("Exam pressure");
  });

  it("invalid moodScore → 400, service never called", async () => {
    const res = await analyzePost(
      analyzeRequest({ content: "Some content here for testing", moodScore: 0, date: "2024-06-15" })
    );
    expect(res.status).toBe(400);
    expect(mockAnalyseJournal).not.toHaveBeenCalled();
  });

  it("content too short → 400", async () => {
    const res = await analyzePost(
      analyzeRequest({ content: "too short", moodScore: 5, date: "2024-06-15" })
    );
    expect(res.status).toBe(400);
  });

  it("service error → 502, error message is generic", async () => {
    mockAnalyseJournal.mockRejectedValueOnce(new Error("Gemini internal error"));
    const res = await analyzePost(
      analyzeRequest({
        content: "Feeling very overwhelmed by my study load today.",
        moodScore: 2,
        date: "2024-06-15",
      })
    );
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error).not.toContain("Gemini");
  });

  it("crisis flagged in analysis is passed through unmodified", async () => {
    mockAnalyseJournal.mockResolvedValueOnce({
      ...MOCK_ANALYSIS,
      crisisDetected: true,
      motivationalMessage: "Please call iCall – 9152987821 right now.",
    });

    const res = await analyzePost(
      analyzeRequest({
        content: "I do not want to be here anymore, everything is hopeless.",
        moodScore: 1,
        date: "2024-06-15",
      })
    );

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.analysis.crisisDetected).toBe(true);
    expect(body.analysis.motivationalMessage).toContain("iCall");
  });
});

describe("E2E smoke — POST /api/chat", () => {
  it("full happy-path: valid request → 200 with reply", async () => {
    mockSendChatMessage.mockResolvedValueOnce(
      "I hear you, Aarav. Let us take this one step at a time."
    );

    const res = await chatPost(
      chatRequest({
        message: "I am feeling overwhelmed.",
        history: [],
        userContext: { displayName: "Aarav", examType: "JEE", recentMoodScore: 4 },
      })
    );

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.reply).toContain("Aarav");
  });

  it("multi-turn history is forwarded to service", async () => {
    mockSendChatMessage.mockResolvedValueOnce("Try the box breathing exercise.");

    const history = [
      { role: "user" as const, content: "I am stressed" },
      { role: "assistant" as const, content: "Tell me more" },
    ];

    await chatPost(
      chatRequest({
        message: "What should I do?",
        history,
        userContext: { displayName: "Priya", examType: "NEET" },
      })
    );

    expect(mockSendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ history })
    );
  });

  it("empty message → 400, service never called", async () => {
    const res = await chatPost(
      chatRequest({
        message: "",
        history: [],
        userContext: { displayName: "Rahul", examType: "JEE" },
      })
    );
    expect(res.status).toBe(400);
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it("service error → 502 with generic message", async () => {
    mockSendChatMessage.mockRejectedValueOnce(new Error("quota exceeded"));

    const res = await chatPost(
      chatRequest({
        message: "Can you help me with anxiety?",
        history: [],
        userContext: { displayName: "Sneha", examType: "CAT" },
      })
    );

    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error).not.toContain("quota");
  });
});
