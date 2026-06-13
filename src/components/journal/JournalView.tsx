"use client";

// JournalView — stub (Phase 3 expands)
import type { UserProfile } from "@/types";

type JournalViewProps = { readonly profile: UserProfile };

export default function JournalView({ profile: _ }: JournalViewProps) {
  return (
    <section aria-labelledby="journal-heading">
      <h2 id="journal-heading" className="text-xl font-semibold text-slate-800 mb-4">
        Daily Journal
      </h2>
      <p className="text-slate-500">Journal coming in Phase 3…</p>
    </section>
  );
}
