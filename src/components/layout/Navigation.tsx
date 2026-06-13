"use client";

import { useState } from "react";
import { LayoutDashboard, BookOpen, MessageCircle, Leaf, Settings, X } from "lucide-react";
import type { UserProfile } from "@/types";
import type { AppTab } from "./AppShell";
import { cn, daysUntilExam } from "@/lib/utils";
import { storageClearAll } from "@/lib/storage";

type NavigationProps = {
  readonly profile: UserProfile;
  readonly activeTab: AppTab;
  readonly onTabChange: (tab: AppTab) => void;
  readonly onProfileUpdate: (profile: UserProfile) => void;
};

const NAV_ITEMS: Array<{ id: AppTab; label: string; Icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "chat", label: "Companion", Icon: MessageCircle },
  { id: "mindfulness", label: "Mindfulness", Icon: Leaf },
];

export default function Navigation({
  profile,
  activeTab,
  onTabChange,
}: NavigationProps) {
  const [showSettings, setShowSettings] = useState(false);
  const daysLeft = daysUntilExam(profile.examDate);

  const handleClearData = () => {
    if (
      window.confirm(
        "This will permanently delete all your journal entries and chat history. Are you sure?"
      )
    ) {
      storageClearAll();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zen-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-zen-400 to-sage-400 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-semibold text-slate-800">ZenJEE</span>
          </div>

          <nav aria-label="Primary navigation">
            <ul className="flex gap-1">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => onTabChange(id)}
                    aria-current={activeTab === id ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      activeTab === id
                        ? "bg-zen-100 text-zen-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            {daysLeft !== null && (
              <div
                className="text-xs bg-zen-50 text-zen-700 px-3 py-1.5 rounded-full font-medium"
                aria-label={`${daysLeft} days until your ${profile.examType} exam`}
              >
                {daysLeft}d to {profile.examType}
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="w-8 h-8 rounded-full bg-zen-100 text-zen-600 flex items-center justify-center hover:bg-zen-200 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-zen-100"
        aria-label="Primary navigation"
      >
        <ul className="flex">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <li key={id} className="flex-1">
              <button
                onClick={() => onTabChange(id)}
                aria-current={activeTab === id ? "page" : undefined}
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  activeTab === id ? "text-zen-600" : "text-slate-400"
                )}
              >
                <Icon
                  className={cn("w-5 h-5", activeTab === id && "scale-110 transition-transform")}
                  aria-hidden="true"
                />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings modal */}
      {showSettings && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
        >
          <div className="card w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 id="settings-title" className="font-semibold text-slate-800 text-lg">
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-1">{profile.displayName}</p>
                <p className="text-slate-500">{profile.examType} aspirant</p>
              </div>

              <hr className="border-zen-100" />

              <p className="text-xs text-slate-500 bg-zen-50 rounded-xl p-3">
                Your data is stored locally on this device and encrypted. Clearing site data in
                your browser will permanently delete your journals.
              </p>

              <button
                onClick={handleClearData}
                className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium
                           py-2 px-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                Clear all data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
