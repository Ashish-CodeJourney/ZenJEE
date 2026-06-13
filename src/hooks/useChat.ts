"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, ChatSession, ChatResponse, MoodScore, UserProfile } from "@/types";

export type ChatHook = {
  session: ChatSession;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearSession: () => void;
};

function newSession(): ChatSession {
  return { id: uuidv4(), messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function useChat(profile: UserProfile, recentMoodScore?: MoodScore): ChatHook {
  const [session, setSession] = useState<ChatSession>(newSession);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, msg],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setIsSending(true);

      try {
        const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history,
            userContext: {
              displayName: profile.displayName,
              examType: profile.examType,
              ...(recentMoodScore !== undefined ? { recentMoodScore } : {}),
            },
          }),
        });

        const data: ChatResponse = await res.json();

        if (!data.success) {
          setError(data.error);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMsg);
      } catch {
        setError("Connection error — please check your internet and try again.");
      } finally {
        setIsSending(false);
      }
    },
    [session.messages, profile, recentMoodScore, addMessage]
  );

  const clearSession = useCallback(() => setSession(newSession()), []);

  return { session, isSending, error, sendMessage, clearSession };
}
