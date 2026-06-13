import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkHealth } from "../healthCheck";
import { _resetGeminiClient } from "../client";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({})),
}));

beforeEach(() => {
  _resetGeminiClient();
});

describe("checkHealth", () => {
  it("returns ok:true when GEMINI_API_KEY is set", () => {
    process.env["GEMINI_API_KEY"] = "test-key";
    const status = checkHealth();
    expect(status.ok).toBe(true);
    expect(status.geminiKeyConfigured).toBe(true);
    expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns ok:false when GEMINI_API_KEY is missing", () => {
    delete process.env["GEMINI_API_KEY"];
    _resetGeminiClient();
    const status = checkHealth();
    expect(status.ok).toBe(false);
    expect(status.geminiKeyConfigured).toBe(false);
  });
});
