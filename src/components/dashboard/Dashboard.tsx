"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { BookOpen, MessageCircle, Leaf, TrendingUp, Calendar, Flame } from "lucide-react";
import type { UserProfile } from "@/types";
import type { AppTab } from "@/components/layout/AppShell";
import { useJournal } from "@/hooks/useJournal";
import {
  buildMoodTrend,
  daysUntilExam,
  formatDateShort,
  moodLabelToEmoji,
  averageMoodScore,
  todayISO,
  cn,
} from "@/lib/utils";
import { MOOD_COLOR_MAP, MOOD_LABEL_MAP } from "@/types";

type DashboardProps = {
  readonly profile: UserProfile;
  readonly onNavigate: (tab: AppTab) => void;
};

export default function Dashboard({ profile, onNavigate }: DashboardProps) {
  const { entries, todayEntry } = useJournal();
  const daysLeft = daysUntilExam(profile.examDate);
  const trend = useMemo(() => buildMoodTrend(entries), [entries]);

  const last7 = useMemo(() => trend.slice(-7), [trend]);

  const avgMood = useMemo(
    () => (entries.length > 0 ? averageMoodScore(entries.map((e) => e.moodScore)) : null),
    [entries]
  );

  const streak = useMemo(() => {
    const dates = new Set(entries.map((e) => e.date));
    let count = 0;
    while (true) {
      const d = new Date();
      d.setDate(d.getDate() - count);
      if (!dates.has(format(d, "yyyy-MM-dd"))) break;
      count++;
    }
    return count;
  }, [entries]);

  const topTriggers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const t of e.analysis?.stressTriggers ?? []) {
        counts.set(t.trigger, (counts.get(t.trigger) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([trigger, count]) => ({ trigger, count }));
  }, [entries]);

  const moodMax = 10;
  const chartHeight = 60;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          {greeting()}, {profile.displayName} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {todayEntry
            ? "You've journalled today — great job taking care of yourself."
            : "How are you feeling today? Start with a journal entry."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Day streak"
          value={streak > 0 ? `${streak}` : "0"}
          unit="days"
          Icon={Flame}
          color="text-orange-500"
          bg="bg-orange-50"
        />
        <StatCard
          label="Avg mood"
          value={avgMood !== null ? avgMood.toFixed(1) : "—"}
          unit="/10"
          Icon={TrendingUp}
          color="text-zen-500"
          bg="bg-zen-50"
        />
        <StatCard
          label="Entries"
          value={`${entries.length}`}
          unit="total"
          Icon={BookOpen}
          color="text-sage-600"
          bg="bg-sage-50"
        />
      </div>

      {/* Exam countdown */}
      {daysLeft !== null && (
        <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-zen-50 to-sage-50">
          <div
            className="w-12 h-12 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm shrink-0"
            aria-hidden="true"
          >
            <span className="text-xl font-bold text-zen-600 leading-none">{daysLeft}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <div>
            <p className="font-medium text-slate-800 text-sm">
              {daysLeft === 0 ? "Exam day is today!" : `${profile.examType} in ${daysLeft} days`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {daysLeft > 30
                ? "Long game — consistency beats intensity."
                : daysLeft > 7
                ? "Final stretch — rest is part of prep."
                : "Almost there — trust your preparation."}
            </p>
          </div>
          <Calendar className="w-5 h-5 text-slate-300 ml-auto shrink-0" aria-hidden="true" />
        </div>
      )}

      {/* Mood trend chart */}
      {last7.length > 1 && (
        <section aria-labelledby="trend-heading" className="card p-5">
          <h3
            id="trend-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4"
          >
            7-day mood trend
          </h3>
          <div
            className="flex items-end gap-2"
            role="img"
            aria-label={`Mood trend over last ${last7.length} days`}
          >
            {last7.map((point) => {
              const label = MOOD_LABEL_MAP[point.moodScore];
              const color = MOOD_COLOR_MAP[label];
              const barH = Math.round((point.moodScore / moodMax) * chartHeight);
              return (
                <div key={point.date} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs" aria-hidden="true">
                    {moodLabelToEmoji(label)}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{ height: `${barH}px`, backgroundColor: `${color}99` }}
                    aria-label={`${formatDateShort(point.date)}: mood ${point.moodScore}`}
                  />
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    {formatDateShort(point.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top stress triggers */}
      {topTriggers.length > 0 && (
        <section aria-labelledby="triggers-heading" className="card p-5">
          <h3
            id="triggers-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3"
          >
            Common stress triggers
          </h3>
          <ul className="space-y-2">
            {topTriggers.map(({ trigger, count }) => (
              <li key={trigger} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 truncate">{trigger}</span>
                    <span className="text-slate-400 text-xs shrink-0 ml-2">{count}×</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zen-300 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((count / (topTriggers[0]?.count ?? 1)) * 100)}%`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section aria-labelledby="actions-heading">
        <h3
          id="actions-heading"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3"
        >
          Quick actions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            label={todayEntry ? "Edit journal" : "Write today"}
            Icon={BookOpen}
            onClick={() => onNavigate("journal")}
            color="bg-zen-50 text-zen-600 hover:bg-zen-100"
          />
          <QuickAction
            label="Talk to ZenBot"
            Icon={MessageCircle}
            onClick={() => onNavigate("chat")}
            color="bg-sage-50 text-sage-600 hover:bg-sage-100"
          />
          <QuickAction
            label="Mindfulness"
            Icon={Leaf}
            onClick={() => onNavigate("mindfulness")}
            color="bg-calm-50 text-calm-600 hover:bg-calm-100"
          />
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type StatCardProps = {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly Icon: typeof Flame;
  readonly color: string;
  readonly bg: string;
};

function StatCard({ label, value, unit, Icon, color, bg }: StatCardProps) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", bg)}>
        <Icon className={cn("w-4 h-4", color)} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">
          {value}
          <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

type QuickActionProps = {
  readonly label: string;
  readonly Icon: typeof BookOpen;
  readonly onClick: () => void;
  readonly color: string;
};

function QuickAction({ label, Icon, onClick, color }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card flex flex-col items-center gap-2 p-4 transition-colors duration-200",
        color
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
