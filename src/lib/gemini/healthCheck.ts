// =============================================================================
// Lightweight health-check utility — used by the /api/health route so Vercel
// uptime monitors and integration tests can verify the Gemini key is wired up
// without burning tokens on a real generation request.
// =============================================================================

import { getGeminiClient } from "./client";

export type HealthStatus = {
  readonly ok: boolean;
  readonly geminiKeyConfigured: boolean;
  readonly timestamp: string;
};

export function checkHealth(): HealthStatus {
  let geminiKeyConfigured = false;
  try {
    getGeminiClient();
    geminiKeyConfigured = true;
  } catch {
    geminiKeyConfigured = false;
  }

  return {
    ok: geminiKeyConfigured,
    geminiKeyConfigured,
    timestamp: new Date().toISOString(),
  };
}
