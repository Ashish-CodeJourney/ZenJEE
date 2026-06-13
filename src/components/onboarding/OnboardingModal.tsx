"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Sparkles, BookOpen, Target, Calendar } from "lucide-react";
import type { UserProfile, ExamType } from "@/types";
import { UserProfileSchema } from "@/lib/validators/schemas";
import { storageSet } from "@/lib/storage";
import { cn, todayISO } from "@/lib/utils";

type OnboardingModalProps = {
  readonly onComplete: (profile: UserProfile) => void;
};

const EXAM_TYPES: ExamType[] = ["JEE", "NEET", "CUET", "CAT", "GATE", "UPSC", "OTHER"];

type FormState = {
  displayName: string;
  examType: ExamType;
  examDate: string;
};

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>({
    displayName: "",
    examType: "JEE",
    examDate: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!form.displayName.trim()) {
      setError("Please tell us your name.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleComplete = () => {
    const result = UserProfileSchema.safeParse({
      displayName: form.displayName,
      examType: form.examType,
      examDate: form.examDate || null,
    });

    if (!result.success) {
      setError(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    const profile: UserProfile = {
      id: uuidv4(),
      displayName: result.data.displayName,
      examType: result.data.examType,
      examDate: result.data.examDate,
      createdAt: new Date().toISOString(),
    };

    storageSet("zenjee:profile", profile);
    onComplete(profile);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="min-h-screen flex items-center justify-center p-4
                 bg-gradient-to-br from-zen-50 via-white to-sage-50"
    >
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zen-400 to-sage-400
                       flex items-center justify-center mx-auto mb-4 shadow-lg"
            aria-hidden="true"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1
            id="onboarding-title"
            className="text-2xl font-bold text-slate-800"
          >
            Welcome to ZenJEE
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Your AI-powered mental wellness companion
          </p>
        </div>

        <div className="card p-8">
          {/* Step indicators */}
          <div className="flex gap-2 mb-8" aria-label="Setup progress">
            {([1, 2] as const).map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  step >= s ? "bg-zen-500" : "bg-slate-200"
                )}
                aria-label={`Step ${s} ${step >= s ? "completed" : "pending"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-semibold text-slate-800 text-lg mb-1">
                  Let&apos;s get to know you
                </h2>
                <p className="text-slate-500 text-sm">
                  This information stays on your device.
                </p>
              </div>

              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Your first name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Aarav"
                  className="input-field"
                  autoFocus
                  maxLength={50}
                  aria-required="true"
                />
              </div>

              {error && (
                <p role="alert" className="text-red-500 text-sm">
                  {error}
                </p>
              )}

              <button onClick={handleNext} className="btn-primary w-full">
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-semibold text-slate-800 text-lg mb-1">
                  Your exam journey
                </h2>
                <p className="text-slate-500 text-sm">
                  We&apos;ll personalise your wellness support around your goals.
                </p>
              </div>

              <div>
                <label
                  htmlFor="examType"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  <Target className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                  Which exam are you preparing for?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {EXAM_TYPES.map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, examType: exam }))}
                      aria-pressed={form.examType === exam}
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-200",
                        form.examType === exam
                          ? "bg-zen-500 text-white border-zen-500"
                          : "bg-white text-slate-600 border-slate-200 hover:border-zen-300"
                      )}
                    >
                      {exam}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="examDate"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  <Calendar className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                  Exam date (optional)
                </label>
                <input
                  id="examDate"
                  type="date"
                  value={form.examDate}
                  onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                  min={todayISO()}
                  className="input-field"
                />
              </div>

              {error && (
                <p role="alert" className="text-red-500 text-sm">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button onClick={handleComplete} className="btn-primary flex-1">
                  <BookOpen className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
                  Start my journey
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ZenJEE is a wellness aid, not a substitute for professional mental health support.
        </p>
      </div>
    </div>
  );
}
