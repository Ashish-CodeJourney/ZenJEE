"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, RefreshCw, AlertTriangle } from "lucide-react";
import type { UserProfile } from "@/types";
import { useChat } from "@/hooks/useChat";
import { useJournal } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

type ChatViewProps = { readonly profile: UserProfile };

const STARTER_PROMPTS = [
  "I'm feeling really stressed about my upcoming exam.",
  "Can you give me a quick breathing exercise?",
  "I keep comparing myself to other students.",
  "Help me make a calm evening study plan.",
];

export default function ChatView({ profile }: ChatViewProps) {
  const { todayEntry } = useJournal();
  const { session, isSending, error, sendMessage, clearSession } = useChat(
    profile,
    todayEntry?.moodScore
  );

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isSending]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = session.messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Your Companion</h2>
          <p className="text-sm text-slate-500">ZenBot is here to listen, always.</p>
        </div>
        {!isEmpty && (
          <button
            onClick={clearSession}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
            aria-label="Start a new conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            New chat
          </button>
        )}
      </div>

      {/* Message area */}
      <div
        className="flex-1 overflow-y-auto space-y-4 py-2 px-1"
        role="log"
        aria-label="Conversation with ZenBot"
        aria-live="polite"
      >
        {/* Welcome state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zen-400 to-sage-400
                           flex items-center justify-center mx-auto text-2xl shadow-md"
                aria-hidden="true"
              >
                🌿
              </div>
              <p className="font-medium text-slate-800">Hi {profile.displayName} 👋</p>
              <p className="text-sm text-slate-500 max-w-xs">
                I&apos;m ZenBot, your wellness companion. Share what&apos;s on your mind — no
                judgement, just support.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-slate-600 bg-white border border-zen-100
                             hover:border-zen-300 hover:bg-zen-50 rounded-xl px-4 py-2.5
                             transition-all duration-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-xl bg-gradient-to-br from-zen-400 to-sage-400
                           flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-sm"
                aria-hidden="true"
              >
                🌿
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-zen-500 text-white rounded-tr-sm"
                  : "bg-white border border-zen-100 text-slate-800 rounded-tl-sm shadow-sm"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <time
                dateTime={msg.timestamp}
                className={cn(
                  "block text-xs mt-1.5",
                  msg.role === "user" ? "text-white/60" : "text-slate-400"
                )}
              >
                {format(parseISO(msg.timestamp), "h:mm a")}
              </time>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-3 justify-start" aria-label="ZenBot is typing" role="status">
            <div
              className="w-7 h-7 rounded-xl bg-gradient-to-br from-zen-400 to-sage-400
                         flex items-center justify-center text-sm shrink-0 shadow-sm"
              aria-hidden="true"
            >
              🌿
            </div>
            <div className="bg-white border border-zen-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zen-400 animate-pulse-gentle"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-zen-100 mt-2">
        <div className="flex gap-2 items-end">
          <label htmlFor="chat-input" className="sr-only">
            Message ZenBot
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            maxLength={1000}
            disabled={isSending}
            className={cn(
              "input-field resize-none leading-relaxed flex-1 min-h-[44px] max-h-32",
              "overflow-y-auto py-3"
            )}
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
            aria-label="Message ZenBot"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="btn-primary px-4 py-3 shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          ZenBot is a wellness aid, not a substitute for professional mental health support.
        </p>
      </div>
    </div>
  );
}
