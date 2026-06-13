"use client";

import { useState } from "react";
import { Wind, Brain, Anchor, Eye, Activity, Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Exercise = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly durationMinutes: number;
  readonly type: "breathing" | "meditation" | "grounding" | "visualization" | "movement";
  readonly instructions: readonly string[];
  readonly badge: string;
};

const ICON_MAP = {
  breathing: Wind,
  meditation: Brain,
  grounding: Anchor,
  visualization: Eye,
  movement: Activity,
} as const;

const COLOR_MAP = {
  breathing: "bg-zen-50 text-zen-600 border-zen-200",
  meditation: "bg-calm-50 text-calm-600 border-calm-200",
  grounding: "bg-sage-50 text-sage-600 border-sage-200",
  visualization: "bg-sand-50 text-sand-600 border-sand-200",
  movement: "bg-orange-50 text-orange-600 border-orange-200",
} as const;

const FILTER_TYPES: Array<{ value: Exercise["type"] | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "breathing", label: "Breathing" },
  { value: "grounding", label: "Grounding" },
  { value: "meditation", label: "Meditation" },
  { value: "movement", label: "Movement" },
  { value: "visualization", label: "Visualisation" },
];

const EXERCISES: readonly Exercise[] = [
  {
    id: "box-breathing",
    title: "Box Breathing",
    description: "Used by athletes and military for instant calm. Regulates your nervous system in under 5 minutes.",
    durationMinutes: 5,
    type: "breathing",
    badge: "Most popular",
    instructions: [
      "Sit comfortably with your back straight and feet flat.",
      "Exhale completely through your mouth.",
      "Inhale slowly through your nose for 4 counts.",
      "Hold your breath for 4 counts.",
      "Exhale slowly through your mouth for 4 counts.",
      "Hold empty for 4 counts.",
      "Repeat 4–6 times. Feel the calm arrive.",
    ],
  },
  {
    id: "5-4-3-2-1",
    title: "5-4-3-2-1 Grounding",
    description: "Anchors you in the present moment. Excellent for pre-exam anxiety and racing thoughts.",
    durationMinutes: 3,
    type: "grounding",
    badge: "For anxiety",
    instructions: [
      "Notice 5 things you can see. Really look at them.",
      "Notice 4 things you can physically feel — your chair, your clothes.",
      "Notice 3 things you can hear — distant sounds, your breath.",
      "Notice 2 things you can smell.",
      "Notice 1 thing you can taste.",
      "Take one slow, deep breath. You are here. You are safe.",
    ],
  },
  {
    id: "body-scan",
    title: "Quick Body Scan",
    description: "Release physical tension held from long study sessions. Especially useful before sleep.",
    durationMinutes: 7,
    type: "meditation",
    badge: "For tension",
    instructions: [
      "Lie down or sit comfortably. Close your eyes.",
      "Take three slow breaths to settle in.",
      "Bring attention to your feet. Notice any tension. Let it go.",
      "Move slowly upward — calves, thighs, hips. Release tightness.",
      "Scan your belly and chest. Let each exhale carry stress away.",
      "Continue through your shoulders, neck, and jaw — common tension spots for students.",
      "Finally, soften your forehead and the area around your eyes.",
      "Rest for a moment. You are allowed to relax.",
    ],
  },
  {
    id: "power-pose",
    title: "2-Minute Confidence Reset",
    description: "Research-backed posture change that reduces cortisol and increases confidence before a test.",
    durationMinutes: 2,
    type: "movement",
    badge: "Pre-exam",
    instructions: [
      "Stand up and find a private space (bathroom stall works fine).",
      "Plant your feet shoulder-width apart.",
      "Put your hands on your hips — the 'Wonder Woman' pose.",
      "Lift your chin slightly and look forward.",
      "Hold this for 2 full minutes while breathing slowly.",
      "Tell yourself: 'I have prepared. I am ready. I can do this.'",
      "Walk into your exam room.",
    ],
  },
  {
    id: "visualisation",
    title: "Success Visualisation",
    description: "Mentally rehearse performing well. Used by Olympians to prime the brain for peak performance.",
    durationMinutes: 6,
    type: "visualization",
    badge: "Motivating",
    instructions: [
      "Sit quietly and close your eyes.",
      "Take five slow breaths to settle your mind.",
      "Picture yourself arriving at the exam hall feeling calm and prepared.",
      "See yourself reading the first question clearly and confidently.",
      "Visualise your hand moving steadily as you write — you know this material.",
      "Feel the quiet satisfaction of finishing each section.",
      "See yourself leaving the hall knowing you gave your best.",
      "Carry that feeling with you now.",
    ],
  },
  {
    id: "4-7-8",
    title: "4-7-8 Breathing",
    description: "Dr. Andrew Weil's technique — acts like a natural sedative for the nervous system.",
    durationMinutes: 4,
    type: "breathing",
    badge: "For sleep",
    instructions: [
      "Sit or lie comfortably. Place the tip of your tongue behind your upper front teeth.",
      "Exhale completely through your mouth with a whoosh sound.",
      "Close your mouth. Inhale quietly through your nose for 4 counts.",
      "Hold your breath for 7 counts.",
      "Exhale completely through your mouth for 8 counts (whoosh).",
      "This completes one cycle. Repeat 3 more times.",
      "Use before sleep or when anxiety spikes.",
    ],
  },
];

export default function MindfulnessView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(new Set());
  const [filter, setFilter] = useState<Exercise["type"] | "all">("all");

  const filtered = filter === "all" ? EXERCISES : EXERCISES.filter((e) => e.type === filter);

  const markDone = (id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
    setActiveId(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Mindfulness Library</h2>
        <p className="text-slate-500 text-sm mt-1">
          Short, science-backed exercises for exam warriors. No equipment needed.
        </p>
      </div>

      {/* Filter pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="group"
        aria-label="Filter exercises by type"
      >
        {FILTER_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
              filter === value
                ? "bg-zen-500 text-white border-zen-500"
                : "bg-white text-slate-600 border-slate-200 hover:border-zen-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {filtered.map((exercise) => {
          const Icon = ICON_MAP[exercise.type];
          const colorClass = COLOR_MAP[exercise.type];
          const isActive = activeId === exercise.id;
          const isDone = completedIds.has(exercise.id);

          return (
            <div key={exercise.id} className="card overflow-hidden">
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                      colorClass
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm">{exercise.title}</h3>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {exercise.badge}
                      </span>
                      {isDone && (
                        <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" aria-hidden="true" /> Done today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{exercise.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{exercise.durationMinutes} min</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveId(isActive ? null : exercise.id)}
                  aria-expanded={isActive}
                  aria-controls={`exercise-steps-${exercise.id}`}
                  className={cn(
                    "mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                    isActive
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : "bg-zen-500 text-white border-zen-500 hover:bg-zen-600"
                  )}
                >
                  {!isActive && <Play className="w-3.5 h-3.5" aria-hidden="true" />}
                  {isActive ? "Close" : "Start exercise"}
                </button>
              </div>

              {/* Expandable steps */}
              {isActive && (
                <div
                  id={`exercise-steps-${exercise.id}`}
                  className="border-t border-zen-100 bg-zen-50/50 px-5 pb-5 pt-4 animate-slide-up"
                  aria-live="polite"
                >
                  <ol className="space-y-3" aria-label={`Steps for ${exercise.title}`}>
                    {exercise.instructions.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700">
                        <span
                          className="w-6 h-6 rounded-full bg-zen-100 text-zen-600 text-xs flex items-center justify-center shrink-0 font-semibold mt-0.5"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => markDone(exercise.id)}
                    className="mt-5 btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    Mark as done
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
