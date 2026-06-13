"use client";

import { useEffect, useState } from "react";
import { storageGet } from "@/lib/storage";
import type { UserProfile } from "@/types";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import AppShell from "@/components/layout/AppShell";

/**
 * Root page — determines whether to show onboarding or the main app.
 * No server-side data fetching needed: all state lives in localStorage.
 */
export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = storageGet("zenjee:profile", null);
    setProfile(stored);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-label="Loading ZenJEE"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-zen-200 border-t-zen-500 animate-spin"
            aria-hidden="true"
          />
          <p className="text-slate-500 text-sm">Loading your sanctuary…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <OnboardingModal onComplete={setProfile} />;
  }

  return <AppShell profile={profile} onProfileUpdate={setProfile} />;
}
