// =============================================================================
// General-purpose utilities — pure functions, no side effects.
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isYesterday, differenceInDays } from "date-fns";
import type { MoodScore, MoodLabel, MoodTrend, WeeklySummary, JournalEntry } from "@/types";
import { MOOD_LABEL_MAP } from "@/types";

// -----------------------------------------------------------------------------
// Tailwind class merging
// -----------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Mood utilities
// -----------------------------------------------------------------------------

export function moodScoreToLabel(score: MoodScore): MoodLabel {
  return MOOD_LABEL_MAP[score];
}

const MOOD_EMOJI_MAP: Record<MoodLabel, string> = {
  overwhelmed: "😰",
  anxious: "😟",
  low: "😔",
  neutral: "😐",
  calm: "😌",
  good: "🙂",
  focused: "🎯",
  motivated: "💪",
  joyful: "😊",
  excellent: "🌟",
};

export function moodLabelToEmoji(label: MoodLabel): string {
  return MOOD_EMOJI_MAP[label];
}

export function averageMoodScore(scores: readonly MoodScore[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// -----------------------------------------------------------------------------
// Date utilities
// -----------------------------------------------------------------------------

export function formatDateLabel(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export function formatDateShort(isoDate: string): string {
  return format(parseISO(isoDate), "MMM d");
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function daysUntilExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const diff = differenceInDays(parseISO(examDate), new Date());
  return Math.max(0, diff);
}

// -----------------------------------------------------------------------------
// Analytics
// -----------------------------------------------------------------------------

export function buildMoodTrend(entries: readonly JournalEntry[]): readonly MoodTrend[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, moodScore: e.moodScore, moodLabel: e.moodLabel }));
}

export function buildWeeklySummary(
  entries: readonly JournalEntry[],
  weekStart: string,
  weekEnd: string
): WeeklySummary {
  const weekEntries = entries.filter((e) => e.date >= weekStart && e.date <= weekEnd);

  const avgMood =
    weekEntries.length > 0
      ? averageMoodScore(weekEntries.map((e) => e.moodScore))
      : 0;

  const triggerCounts = new Map<string, { count: number; category: string }>();
  for (const entry of weekEntries) {
    if (!entry.analysis) continue;
    for (const t of entry.analysis.stressTriggers) {
      const existing = triggerCounts.get(t.trigger);
      triggerCounts.set(t.trigger, { count: (existing?.count ?? 0) + 1, category: t.category });
    }
  }

  const topTriggers = [...triggerCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([trigger, { count, category }]) => ({
      trigger,
      count,
      category: category as WeeklySummary["topTriggers"][number]["category"],
    }));

  const sentiments = weekEntries
    .filter((e) => e.analysis)
    .map((e) => e.analysis!.sentiment);

  const sentimentCounts = sentiments.reduce(
    (acc, s) => ({ ...acc, [s]: acc[s] + 1 }),
    { negative: 0, neutral: 0, positive: 0 } as Record<"negative" | "neutral" | "positive", number>
  );
  const dominantSentiment = (
    Object.entries(sentimentCounts) as ["negative" | "neutral" | "positive", number][]
  ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";

  return {
    weekStart,
    weekEnd,
    averageMood: Math.round(avgMood * 10) / 10,
    entriesCount: weekEntries.length,
    topTriggers,
    dominantSentiment,
  };
}

// -----------------------------------------------------------------------------
// Text sanitisation (XSS prevention before rendering user content as HTML)
// React already escapes JSX strings; this is a belt-and-suspenders guard for
// any path that uses dangerouslySetInnerHTML or sends text to the AI service.
// -----------------------------------------------------------------------------

export function sanitizeText(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Strips HTML tags — used to clean AI output before storing in plain text. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
