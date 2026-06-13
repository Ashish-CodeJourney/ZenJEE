import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendChatMessage } from "../services/chatService";
import { _resetGeminiClient } from "../client";

// ---------------------------------------------------------------------------
// Mock the Gemini SDK
// ---------------------------------------------------------------------------

const mockSendMessage = vi.fn();
const mockStartChat = vi.fn().mockReturnValue({ sendMessage: mockSendMessage });

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      startChat: mockStartChat,
    }),
  })),
}));

const BASE_PARAMS = {
  message: "I am feeling really anxious about tomorrow's test.",
  history: [] as const,
  userContext: {
    displayName: "Aarav",
    examType: "JEE" as const,
    recentMoodScore: 4 as const,
  },
};

beforeEach(() => {
  _resetGeminiClient();
  vi.clearAllMocks();
  process.env["GEMINI_API_KEY"] = "test-key";
});

describe("sendChatMessage", () => {
  it("returns the assistant reply text", async () => {
    mockSendMessage.mockResolvedValueOnce({
      response: { text: () => "I hear you, Aarav. Exam anxiety is completely normal." },
    });

    const reply = await sendChatMessage(BASE_PARAMS);
    expect(reply).toBe("I hear you, Aarav. Exam anxiety is completely normal.");
  });

  it("passes the user message to Gemini", async () => {
    mockSendMessage.mockResolvedValueOnce({
      response: { text: () => "Some reply" },
    });

    await sendChatMessage(BASE_PARAMS);
    expect(mockSendMessage).toHaveBeenCalledWith(BASE_PARAMS.message);
  });

  it("passes conversation history to startChat", async () => {
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "Reply" } });

    const history = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi there" },
    ];

    await sendChatMessage({ ...BASE_PARAMS, history });

    const startChatArg = mockStartChat.mock.calls[0]?.[0] as { history: unknown[] };
    expect(startChatArg.history).toHaveLength(2);
    // assistant → model conversion
    expect((startChatArg.history[1] as { role: string }).role).toBe("model");
  });

  it("trims whitespace from the reply", async () => {
    mockSendMessage.mockResolvedValueOnce({
      response: { text: () => "  Response with padding.  " },
    });

    const reply = await sendChatMessage(BASE_PARAMS);
    expect(reply).toBe("Response with padding.");
  });

  it("throws when Gemini returns an empty response", async () => {
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "   " } });

    await expect(sendChatMessage(BASE_PARAMS)).rejects.toThrow("empty chat response");
  });

  it("propagates Gemini API errors", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("Gemini API quota exceeded"));

    await expect(sendChatMessage(BASE_PARAMS)).rejects.toThrow("Gemini API quota exceeded");
  });

  it("throws when GEMINI_API_KEY is not set", async () => {
    delete process.env["GEMINI_API_KEY"];
    _resetGeminiClient();

    await expect(sendChatMessage(BASE_PARAMS)).rejects.toThrow("GEMINI_API_KEY");
  });

  it("works with an empty history array", async () => {
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "Welcome!" } });

    const reply = await sendChatMessage({ ...BASE_PARAMS, history: [] });
    expect(reply).toBe("Welcome!");

    const startChatArg = mockStartChat.mock.calls[0]?.[0] as { history: unknown[] };
    expect(startChatArg.history).toEqual([]);
  });

  it("works without an optional recentMoodScore", async () => {
    mockSendMessage.mockResolvedValueOnce({ response: { text: () => "Sure thing!" } });

    const params = {
      ...BASE_PARAMS,
      userContext: { displayName: "Priya", examType: "NEET" as const },
    };

    await expect(sendChatMessage(params)).resolves.toBe("Sure thing!");
  });
});
