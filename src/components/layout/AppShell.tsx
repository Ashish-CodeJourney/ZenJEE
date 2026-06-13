"use client";

import { useState } from "react";
import type { UserProfile } from "@/types";
import Navigation from "./Navigation";
import Dashboard from "@/components/dashboard/Dashboard";
import JournalView from "@/components/journal/JournalView";
import ChatView from "@/components/chat/ChatView";
import MindfulnessView from "@/components/mindfulness/MindfulnessView";

export type AppTab = "dashboard" | "journal" | "chat" | "mindfulness";

type AppShellProps = {
  readonly profile: UserProfile;
  readonly onProfileUpdate: (profile: UserProfile) => void;
};

export default function AppShell({ profile, onProfileUpdate }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard profile={profile} onNavigate={setActiveTab} />;
      case "journal":
        return <JournalView profile={profile} />;
      case "chat":
        return <ChatView profile={profile} />;
      case "mindfulness":
        return <MindfulnessView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onProfileUpdate={onProfileUpdate}
      />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 md:pb-6"
        aria-label={`${activeTab} view`}
      >
        <div className="animate-fade-in">{renderView()}</div>
      </main>
    </div>
  );
}
