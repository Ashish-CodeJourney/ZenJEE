// =============================================================================
// Gemini API client factory.
// The API key must never appear in client bundles — this module is server-only.
// All consumer files (API routes, services) import from here so the key is
// validated once at startup rather than silently failing mid-request.
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Models used across the app — centralised so a version bump is one-line.
export const GEMINI_MODELS = {
  // Fast model with JSON mode support — used for structured journal analysis.
  analysis: "gemini-1.5-flash",
  // Same model for chat — generous context window fits conversation history.
  chat: "gemini-1.5-flash",
} as const;

let _client: GoogleGenerativeAI | null = null;

/**
 * Returns a singleton Gemini client.
 * Throws on first call if GEMINI_API_KEY is absent so misconfigured deploys
 * surface immediately rather than failing only when a user makes a request.
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (server-only — never expose to the client)."
    );
  }

  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

/** Resets the singleton — used in tests to inject a mock client. */
export function _resetGeminiClient(): void {
  _client = null;
}
