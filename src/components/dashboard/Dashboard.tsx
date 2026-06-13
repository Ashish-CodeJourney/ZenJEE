"use client";

// Dashboard — stub (Phase 3 expands this into full analytics view)
import type { UserProfile } from "@/types";
import type { AppTab } from "@/components/layout/AppShell";

type DashboardProps = {
  readonly profile: UserProfile;
  readonly onNavigate: (tab: AppTab) => void;
};

export default function Dashboard({ profile, onNavigate }: DashboardProps) {
  return (
    <section aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="text-xl font-semibold text-slate-800 mb-4">
        Welcome back, {profile.displayName}
      </h2>
      <p className="text-slate-500">Your dashboard is loading…</p>
      <button onClick={() => onNavigate("journal")} className="btn-primary mt-4">
        Write today&apos;s journal
      </button>
    </section>
  );
}
