import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// ---------------------------------------------------------------------------
// Mock the analysis service — route tests verify HTTP behaviour, not AI logic.
// vi.hoisted ensures the mock fn is initialised before vi.mock hoisting runs.
// ---------------------------------------------------------------------------

const { mockAnalyseJournal } = vi.hoisted(() => ({
  mockAnalyseJournal: vi.fn(),
}));

vi.mock("@/lib/gemini/services/journalAnalysisService", () => ({
  analyseJournal: mockAnalyseJournal,
}));

const MOCK_ANALYSIS = {
  sentiment: "negative",
  sentimentIntensity: 0.7,
  stressTriggers: [],
  emotionalPatterns: [],
  copingStrategies: [],
  mindfulnessExercise: {
    id: "ex-1",
    title: "Box Breathing",
    description: "desc",
    durationMinutes: 5,
    type: "breathing",
    instructions: [],
  },
  motivationalMessage: "Keep going.",
  crisisDetected: false,
  summary: "Test summary.",
};

const validBody = {
  content: "I am really stressed about my JEE preparation today.",
  moodScore: 3,
  date: "2024-06-15",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/analyze-journal", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `${Math.random()}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/analyze-journal", () => {
  it("returns 200 with analysis on valid input", async () => {
    mockAnalyseJournal.mockResolvedValueOnce(MOCK_ANALYSIS);

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.analysis.sentiment).toBe("negative");
  });

  it("returns 400 for missing content field", async () => {
    const res = await POST(makeRequest({ moodScore: 3, date: "2024-06-15" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(typeof json.error).toBe("string");
  });

  it("returns 400 for content shorter than 10 characters", async () => {
    const res = await POST(makeRequest({ ...validBody, content: "short" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid moodScore (out of range)", async () => {
    const res = await POST(makeRequest({ ...validBody, moodScore: 11 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await POST(makeRequest({ ...validBody, date: "15/06/2024" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/analyze-journal", {
      method: "POST",
      headers: { "Content-Type": "text/plain", "x-forwarded-for": "1.2.3.4" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when the analysis service throws", async () => {
    mockAnalyseJournal.mockRejectedValueOnce(new Error("Gemini error"));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    // Must not leak the internal error message to the client
    expect(json.error).not.toContain("Gemini error");
  });

  it("returns 429 after exceeding rate limit", async () => {
    mockAnalyseJournal.mockResolvedValue(MOCK_ANALYSIS);

    // Exhaust the limit from a single IP (config: 10/min)
    const ip = `rate-test-${Date.now()}`;
    const makeRateLimitedRequest = () =>
      new Request("http://localhost/api/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(validBody),
      });

    for (let i = 0; i < 10; i++) {
      await POST(makeRateLimitedRequest());
    }

    const res = await POST(makeRateLimitedRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
