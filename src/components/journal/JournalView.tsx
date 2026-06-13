"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Sparkles, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { UserProfile, MoodScore, JournalAnalysis } from "@/types";
import type { AnalyzeJournalResponse } from "@/types";
import { useJournal } from "@/hooks/useJournal";
import MoodSlider from "./MoodSlider";
import AnalysisCard from "./AnalysisCard";
import { cn, formatDateLabel, todayISO } from "@/lib/utils";
import { MOOD_COLOR_MAP, MOOD_LABEL_MAP } from "@/types";
import { moodLabelToEmoji } from "@/lib/utils";

type JournalViewProps = { readonly profile: UserProfile };

const DEBOUNCE_MS = 500;

export default function JournalView(_: JournalViewProps) {
  const { entries, todayEntry, isSaving, saveEntry, attachAnalysis, deleteEntry } = useJournal();

  const [content, setContent] = useState(todayEntry?.content ?? "");
  const [moodScore, setMoodScore] = useState<MoodScore>(todayEntry?.moodScore ?? 5);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSaveAndAnalyse = useCallback(async () => {
    if (content.trim().length < 10) return;
    setAnalysisError(null);

    const today = todayISO();
    const trimmed = content.trim();
    const entry = await saveEntry({ date: today, content: trimmed, moodScore, tags: [] });

    setIsAnalysing(true);
    try {
      const res = await fetch("/api/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, moodScore, date: today }),
      });
      const data: AnalyzeJournalResponse = await res.json();
      if (!data.success) {
        setAnalysisError(data.error);
        return;
      }
      attachAnalysis(entry.id, data.analysis as JournalAnalysis);
    } catch {
      setAnalysisError("Could not reach the AI service. Your entry is saved safely.");
    } finally {
      setIsAnalysing(false);
    }
  }, [content, moodScore, saveEntry, attachAnalysis]);

  // Debounced auto-save (content only, no analysis on every keystroke)
  const handleAutoSave = useCallback(
    (val: string) => {
      clearTimeout(debounceRef.current);
      if (val.trim().length < 10) return;
      debounceRef.current = setTimeout(() => {
        saveEntry({ date: todayISO(), content: val.trim(), moodScore, tags: [] });
      }, DEBOUNCE_MS);
    },
    [moodScore, saveEntry]
  );

  const pastEntries = useMemo(
    () => entries.filter((e) => e.date !== todayISO()),
    [entries]
  );

  return (
    <div className="space-y-6">
      {/* Today's entry form */}
      <section aria-labelledby="journal-heading">
        <div className="card p-6 space-y-5">
          <div>
            <h2 id="journal-heading" className="text-lg font-semibold text-slate-800">
              {formatDateLabel(todayISO())}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Write freely — this is your private space.
            </p>
          </div>

          <MoodSlider value={moodScore} onChange={setMoodScore} disabled={isAnalysing} />

          <div>
            <label htmlFor="journal-content" className="sr-only">
              Journal entry
            </label>
            <textarea
              id="journal-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                handleAutoSave(e.target.value);
              }}
              placeholder="What's on your mind today? Talk about your studies, your worries, your small wins…"
              rows={6}
              maxLength={5000}
              disabled={isAnalysing}
              className={cn(
                "input-field resize-none leading-relaxed",
                isAnalysing && "opacity-60"
              )}
              aria-describedby="char-count"
            />
            <p id="char-count" className="text-right text-xs text-slate-400 mt-1" aria-live="polite">
              {content.length}/5000
            </p>
          </div>

          {analysisError && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {analysisError}
            </p>
          )}

          <button
            onClick={handleSaveAndAnalyse}
            disabled={content.trim().length < 10 || isAnalysing || isSaving}
            className="btn-primary w-full flex items-center justify-center gap-2"
            aria-busy={isAnalysing}
          >
            {isAnalysing ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>Analysing your entry…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Save &amp; Get AI Insights</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Today's analysis */}
      {todayEntry?.analysis && (
        <section aria-labelledby="analysis-heading">
          <h2 id="analysis-heading" className="sr-only">
            Today&apos;s AI analysis
          </h2>
          <AnalysisCard analysis={todayEntry.analysis} />
        </section>
      )}

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2
            id="history-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3"
          >
            Past entries
          </h2>
          <div className="space-y-3">
            {pastEntries.map((entry) => {
              const label = MOOD_LABEL_MAP[entry.moodScore];
              const color = MOOD_COLOR_MAP[label];
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`entry-${entry.id}`}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                      aria-hidden="true"
                    >
                      {moodLabelToEmoji(label)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">
                        {formatDateLabel(entry.date)}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{entry.content}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.analysis && (
                        <span className="text-xs text-zen-500 font-medium">Analysed</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div id={`entry-${entry.id}`} className="px-4 pb-4 space-y-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                      {entry.analysis && <AnalysisCard analysis={entry.analysis} />}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Delete entry from ${formatDateLabel(entry.date)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Delete entry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
