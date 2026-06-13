"use client";

// ChatView — stub (Phase 3 expands)
import type { UserProfile } from "@/types";

type ChatViewProps = { readonly profile: UserProfile };

export default function ChatView({ profile: _ }: ChatViewProps) {
  return (
    <section aria-labelledby="chat-heading">
      <h2 id="chat-heading" className="text-xl font-semibold text-slate-800 mb-4">
        AI Companion
      </h2>
      <p className="text-slate-500">Chat coming in Phase 3…</p>
    </section>
  );
}
