"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { storageGet, storageSet } from "@/lib/storage";
import { encrypt, decrypt } from "@/lib/crypto";
import { moodScoreToLabel, todayISO } from "@/lib/utils";
import type { JournalEntry, JournalAnalysis, CreateJournalEntryInput } from "@/types";

export type JournalHook = {
  entries: readonly JournalEntry[];
  todayEntry: JournalEntry | null;
  isLoading: boolean;
  isSaving: boolean;
  isAnalysing: boolean;
  saveEntry: (input: CreateJournalEntryInput) => Promise<JournalEntry>;
  attachAnalysis: (entryId: string, analysis: JournalAnalysis) => void;
  deleteEntry: (entryId: string) => void;
};

export function useJournal(): JournalHook {
  const [entries, setEntries] = useState<readonly JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Decrypt all entries on mount (content is stored encrypted)
  useEffect(() => {
    const stored = storageGet("zenjee:journal", []);
    Promise.all(
      stored.map(async (e) => ({ ...e, content: await decrypt(e.content) }))
    ).then((decrypted) => {
      setEntries(decrypted);
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback((updated: readonly JournalEntry[]) => {
    // Re-encrypt content before writing to storage
    Promise.all(
      updated.map(async (e) => ({ ...e, content: await encrypt(e.content) }))
    ).then((encrypted) => storageSet("zenjee:journal", encrypted));
    setEntries(updated);
  }, []);

  const saveEntry = useCallback(
    async (input: CreateJournalEntryInput): Promise<JournalEntry> => {
      setIsSaving(true);
      try {
        const now = new Date().toISOString();
        const existing = entries.find((e) => e.date === input.date);

        const entry: JournalEntry = {
          id: existing?.id ?? uuidv4(),
          date: input.date,
          content: input.content,
          moodScore: input.moodScore,
          moodLabel: moodScoreToLabel(input.moodScore),
          tags: input.tags,
          analysis: existing?.analysis ?? null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        const updated = existing
          ? entries.map((e) => (e.id === existing.id ? entry : e))
          : [entry, ...entries];

        persist(updated);
        return entry;
      } finally {
        setIsSaving(false);
      }
    },
    [entries, persist]
  );

  const attachAnalysis = useCallback(
    (entryId: string, analysis: JournalAnalysis) => {
      setIsAnalysing(false);
      const updated = entries.map((e) =>
        e.id === entryId ? { ...e, analysis, updatedAt: new Date().toISOString() } : e
      );
      persist(updated);
    },
    [entries, persist]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      persist(entries.filter((e) => e.id !== entryId));
    },
    [entries, persist]
  );

  const today = todayISO();
  const todayEntry = entries.find((e) => e.date === today) ?? null;

  return {
    entries,
    todayEntry,
    isLoading,
    isSaving,
    isAnalysing,
    saveEntry,
    attachAnalysis,
    deleteEntry,
  };
}
