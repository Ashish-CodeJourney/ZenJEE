"use client";

import { AlertTriangle, Heart, Lightbulb, Wind, Zap } from "lucide-react";
import type { JournalAnalysis } from "@/types";
import { cn } from "@/lib/utils";

type AnalysisCardProps = {
  readonly analysis: JournalAnalysis;
};

const SEVERITY_COLOR = {
  mild: "bg-yellow-50 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-50 text-orange-700 border-orange-200",
  high: "bg-red-50 text-red-700 border-red-200",
} as const;

const CATEGORY_ICON = {
  breathing: Wind,
  mindfulness: Wind,
  physical: Zap,
  cognitive: Lightbulb,
  social: Heart,
  creative: Lightbulb,
} as const;

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  return (
    <div className="space-y-5 animate-slide-up">
      {/* Crisis banner — highest priority, always first */}
      {analysis.crisisDetected && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-red-800 space-y-1">
            <p className="font-semibold">We noticed something concerning</p>
            <p>
              Please reach out for support right now:{" "}
              <strong>iCall – 9152987821</strong> |{" "}
              <strong>Vandrevala Foundation – 1860-2662-345</strong> (24/7) |{" "}
              <strong>NIMHANS – 080-46110007</strong>
            </p>
          </div>
        </div>
      )}

      {/* Motivational message */}
      <div className="card p-4 bg-gradient-to-br from-zen-50 to-sage-50 border-zen-100">
        <p className="text-slate-700 text-sm leading-relaxed italic">
          &ldquo;{analysis.motivationalMessage}&rdquo;
        </p>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            What we noticed
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Stress triggers */}
      {analysis.stressTriggers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Stress triggers
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.stressTriggers.map((t, i) => (
              <span
                key={i}
                className={cn(
                  "text-xs px-3 py-1 rounded-full border font-medium",
                  SEVERITY_COLOR[t.severity]
                )}
              >
                {t.trigger}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mindfulness exercise */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="w-4 h-4 text-zen-500" aria-hidden="true" />
          <h3 className="font-medium text-slate-800 text-sm">
            {analysis.mindfulnessExercise.title}
          </h3>
          <span className="text-xs text-slate-400 ml-auto">
            {analysis.mindfulnessExercise.durationMinutes} min
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">{analysis.mindfulnessExercise.description}</p>
        <ol className="space-y-1.5" aria-label="Exercise instructions">
          {analysis.mindfulnessExercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span
                className="w-5 h-5 rounded-full bg-zen-100 text-zen-600 text-xs flex items-center justify-center shrink-0 font-medium"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Coping strategies */}
      {analysis.copingStrategies.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Coping strategies
          </h3>
          <div className="space-y-3">
            {analysis.copingStrategies.map((s) => {
              const Icon = CATEGORY_ICON[s.category] ?? Lightbulb;
              return (
                <details key={s.id} className="card group">
                  <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                    <div className="w-8 h-8 rounded-xl bg-zen-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-zen-500" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{s.title}</p>
                      <p className="text-xs text-slate-500">{s.estimatedMinutes} min</p>
                    </div>
                    <span className="text-slate-400 text-xs group-open:hidden">Expand</span>
                    <span className="text-slate-400 text-xs hidden group-open:inline">Close</span>
                  </summary>
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-slate-600 mb-3">{s.description}</p>
                    <ol className="space-y-1.5" aria-label={`Steps for ${s.title}`}>
                      {s.steps.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span
                            className="w-5 h-5 rounded-full bg-sage-100 text-sage-700 text-xs flex items-center justify-center shrink-0 font-medium"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
