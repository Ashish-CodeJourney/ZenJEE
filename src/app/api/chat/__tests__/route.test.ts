import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// ---------------------------------------------------------------------------
// Mock the chat service.
// vi.hoisted ensures the mock fn is initialised before vi.mock hoisting runs.
// ---------------------------------------------------------------------------

const { mockSendChatMessage } = vi.hoisted(() => ({
  mockSendChatMessage: vi.fn(),
}));

vi.mock("@/lib/gemini/services/chatService", () => ({
  sendChatMessage: mockSendChatMessage,
}));

const validBody = {
  message: "I am feeling overwhelmed by my study schedule.",
  history: [],
  userContext: { displayName: "Aarav", examType: "JEE", recentMoodScore: 4 },
};

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/chat", () => {
  it("returns 200 with reply on valid input", async () => {
    mockSendChatMessage.mockResolvedValueOnce("I understand, let's work through this together.");

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.reply).toBe("I understand, let's work through this together.");
  });

  it("returns 400 for empty message", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for message over 1000 characters", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "a".repeat(1001) }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid examType", async () => {
    const res = await POST(
      makeRequest({ ...validBody, userContext: { ...validBody.userContext, examType: "UNKNOWN" } })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for history with more than 20 items", async () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: "user" as const,
      content: `message ${i}`,
    }));
    const res = await POST(makeRequest({ ...validBody, history }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "text/plain", "x-forwarded-for": "1.2.3.4" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when the chat service throws", async () => {
    mockSendChatMessage.mockRejectedValueOnce(new Error("Gemini quota exceeded"));

    const res = await POST(makeRequest(validBody));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.success).toBe(false);
    // Must not leak internal Gemini error details
    expect(json.error).not.toContain("quota");
  });

  it("returns 429 after exceeding the chat rate limit", async () => {
    mockSendChatMessage.mockResolvedValue("Response");
    const ip = `chat-rate-${Date.now()}`;

    for (let i = 0; i < 30; i++) {
      await POST(makeRequest(validBody, ip));
    }

    const res = await POST(makeRequest(validBody, ip));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("accepts a request without the optional recentMoodScore", async () => {
    mockSendChatMessage.mockResolvedValueOnce("Here to help.");

    const body = {
      ...validBody,
      userContext: { displayName: "Priya", examType: "NEET" },
    };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);
  });

  it("passes history correctly to the service", async () => {
    mockSendChatMessage.mockResolvedValueOnce("Acknowledged.");

    const history = [{ role: "user" as const, content: "First message" }];
    await POST(makeRequest({ ...validBody, history }));

    expect(mockSendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ history })
    );
  });
});
