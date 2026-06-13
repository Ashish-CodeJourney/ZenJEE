// =============================================================================
// Zod validation schemas — single source of truth at all trust boundaries.
// API route handlers validate incoming requests against these schemas before
// any business logic executes, preventing injection / malformed data attacks.
// =============================================================================

import { z } from "zod";

// -----------------------------------------------------------------------------
// Primitives
// -----------------------------------------------------------------------------

export const MoodScoreSchema = z
  .number()
  .int()
  .min(1)
  .max(10) as z.ZodType<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>;

export const ExamTypeSchema = z.enum(["JEE", "NEET", "CUET", "CAT", "GATE", "UPSC", "OTHER"]);

export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");

// -----------------------------------------------------------------------------
// Journal Analysis API
// -----------------------------------------------------------------------------

export const AnalyzeJournalRequestSchema = z.object({
  content: z
    .string()
    .min(10, "Journal entry must be at least 10 characters")
    .max(5000, "Journal entry must be under 5000 characters")
    .trim(),
  moodScore: MoodScoreSchema,
  date: ISODateSchema,
});

// -----------------------------------------------------------------------------
// Chat API
// -----------------------------------------------------------------------------

export const ChatMessageHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be under 1000 characters")
    .trim(),
  history: z.array(ChatMessageHistoryItemSchema).max(20),
  userContext: z.object({
    displayName: z.string().min(1).max(50).trim(),
    examType: ExamTypeSchema,
    recentMoodScore: MoodScoreSchema.optional(),
  }),
});

// -----------------------------------------------------------------------------
// User Profile (client-side validation before writing to localStorage)
// -----------------------------------------------------------------------------

export const UserProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim(),
  examType: ExamTypeSchema,
  examDate: ISODateSchema.nullable(),
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;

// -----------------------------------------------------------------------------
// Rate limiting config (used server-side in API middleware)
// -----------------------------------------------------------------------------

export const RateLimitConfig = {
  analyzeJournal: { requests: 10, windowMs: 60_000 },
  chat: { requests: 30, windowMs: 60_000 },
} as const;
