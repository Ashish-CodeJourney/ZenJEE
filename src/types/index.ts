// =============================================================================
// ZenJEE — Core Domain Types
// All types are derived from Zod schemas in lib/validators/schemas.ts.
// Never define duplicate types — import from here throughout the codebase.
// =============================================================================

// -----------------------------------------------------------------------------
// Mood
// -----------------------------------------------------------------------------

export type MoodScore = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type MoodLabel =
  | "overwhelmed"
  | "anxious"
  | "low"
  | "neutral"
  | "calm"
  | "good"
  | "focused"
  | "motivated"
  | "joyful"
  | "excellent";

export const MOOD_LABEL_MAP: Record<MoodScore, MoodLabel> = {
  1: "overwhelmed",
  2: "anxious",
  3: "low",
  4: "neutral",
  5: "calm",
  6: "good",
  7: "focused",
  8: "motivated",
  9: "joyful",
  10: "excellent",
};

export const MOOD_COLOR_MAP: Record<MoodLabel, string> = {
  overwhelmed: "#ef4444",
  anxious: "#f97316",
  low: "#eab308",
  neutral: "#94a3b8",
  calm: "#22d3ee",
  good: "#4ade80",
  focused: "#60a5fa",
  motivated: "#a78bfa",
  joyful: "#f472b6",
  excellent: "#34d399",
};

// -----------------------------------------------------------------------------
// Journal Entry
// -----------------------------------------------------------------------------

export type StressTrigger = {
  readonly trigger: string;
  readonly severity: "mild" | "moderate" | "high";
  readonly category:
    | "academic"
    | "social"
    | "self-doubt"
    | "physical"
    | "family"
    | "time-management"
    | "other";
};

export type EmotionalPattern = {
  readonly pattern: string;
  readonly frequency: "occasional" | "recurring" | "persistent";
};

export type CopingStrategy = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly category:
    | "breathing"
    | "mindfulness"
    | "physical"
    | "cognitive"
    | "social"
    | "creative";
  readonly steps: readonly string[];
};

export type MindfulnessExercise = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly type: "breathing" | "meditation" | "grounding" | "visualization" | "movement";
  readonly instructions: readonly string[];
};

export type JournalAnalysis = {
  readonly sentiment: "negative" | "neutral" | "positive";
  readonly sentimentIntensity: number; // 0–1
  readonly stressTriggers: readonly StressTrigger[];
  readonly emotionalPatterns: readonly EmotionalPattern[];
  readonly copingStrategies: readonly CopingStrategy[];
  readonly mindfulnessExercise: MindfulnessExercise;
  readonly motivationalMessage: string;
  readonly crisisDetected: boolean;
  readonly summary: string;
};

export type JournalEntry = {
  readonly id: string;
  readonly date: string; // ISO 8601 date string (YYYY-MM-DD)
  readonly content: string; // raw text — encrypted at rest in storage
  readonly moodScore: MoodScore;
  readonly moodLabel: MoodLabel;
  readonly tags: readonly string[];
  readonly analysis: JournalAnalysis | null;
  readonly createdAt: string; // ISO 8601 datetime
  readonly updatedAt: string; // ISO 8601 datetime
};

// Input type for creating a new entry — id/createdAt/updatedAt are generated
export type CreateJournalEntryInput = {
  readonly date: string;
  readonly content: string;
  readonly moodScore: MoodScore;
  readonly tags: readonly string[];
};

// -----------------------------------------------------------------------------
// Chat / Conversational Companion
// -----------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly timestamp: string; // ISO 8601 datetime
};

export type ChatSession = {
  readonly id: string;
  readonly messages: readonly ChatMessage[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

// -----------------------------------------------------------------------------
// User Profile (stored locally — no auth, privacy-first)
// -----------------------------------------------------------------------------

export type ExamType = "JEE" | "NEET" | "CUET" | "CAT" | "GATE" | "UPSC" | "OTHER";

export type UserProfile = {
  readonly id: string; // randomly generated UUID, persisted in localStorage
  readonly displayName: string;
  readonly examType: ExamType;
  readonly examDate: string | null; // ISO 8601 date
  readonly createdAt: string;
};

// -----------------------------------------------------------------------------
// Dashboard / Analytics
// -----------------------------------------------------------------------------

export type MoodTrend = {
  readonly date: string;
  readonly moodScore: MoodScore;
  readonly moodLabel: MoodLabel;
};

export type TriggerFrequency = {
  readonly trigger: string;
  readonly count: number;
  readonly category: StressTrigger["category"];
};

export type WeeklySummary = {
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly averageMood: number;
  readonly entriesCount: number;
  readonly topTriggers: readonly TriggerFrequency[];
  readonly dominantSentiment: "negative" | "neutral" | "positive";
};

// -----------------------------------------------------------------------------
// API request / response shapes (used by Next.js API routes)
// -----------------------------------------------------------------------------

export type AnalyzeJournalRequest = {
  readonly content: string;
  readonly moodScore: MoodScore;
  readonly date: string;
};

export type AnalyzeJournalResponse =
  | { readonly success: true; readonly analysis: JournalAnalysis }
  | { readonly success: false; readonly error: string };

export type ChatRequest = {
  readonly message: string;
  readonly history: readonly Pick<ChatMessage, "role" | "content">[];
  readonly userContext: {
    readonly displayName: string;
    readonly examType: ExamType;
    readonly recentMoodScore?: MoodScore;
  };
};

export type ChatResponse =
  | { readonly success: true; readonly reply: string }
  | { readonly success: false; readonly error: string };

// -----------------------------------------------------------------------------
// Storage schema — what gets persisted to localStorage
// -----------------------------------------------------------------------------

export type StorageSchema = {
  readonly "zenjee:profile": UserProfile | null;
  readonly "zenjee:journal": readonly JournalEntry[];
  readonly "zenjee:chat:current": ChatSession | null;
};

export type StorageKey = keyof StorageSchema;
