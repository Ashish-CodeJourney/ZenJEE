"use client";

import { MOOD_COLOR_MAP, MOOD_LABEL_MAP } from "@/types";
import type { MoodScore } from "@/types";
import { moodLabelToEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";

type MoodSliderProps = {
  readonly value: MoodScore;
  readonly onChange: (score: MoodScore) => void;
  readonly disabled?: boolean;
};

export default function MoodSlider({ value, onChange, disabled = false }: MoodSliderProps) {
  const label = MOOD_LABEL_MAP[value];
  const color = MOOD_COLOR_MAP[label];
  const emoji = moodLabelToEmoji(label);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="mood-slider" className="text-sm font-medium text-slate-700">
          How are you feeling?
        </label>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300"
          style={{ backgroundColor: color }}
          aria-live="polite"
          aria-label={`Mood: ${label}, score ${value} out of 10`}
        >
          <span aria-hidden="true">{emoji}</span>
          <span className="capitalize">{label}</span>
        </div>
      </div>

      <div className="relative">
        {/* Gradient track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-full h-2 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, #ef4444, #f97316, #eab308, #94a3b8, #22d3ee, #4ade80, #60a5fa, #a78bfa, #f472b6, #34d399)",
          }}
          aria-hidden="true"
        />
        <input
          id="mood-slider"
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10) as MoodScore)}
          className={cn(
            "relative w-full h-2 appearance-none bg-transparent cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-zen-500 focus-visible:ring-offset-2 rounded-full",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300",
            "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-125",
            "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-300",
            "[&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={value}
          aria-valuetext={`${label} (${value}/10)`}
        />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-slate-400 px-0.5" aria-hidden="true">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
