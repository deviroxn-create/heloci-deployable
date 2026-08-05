"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardSection {
  id: string;
  label: string;
  icon?: string;
}

interface WizardShellProps {
  sections: WizardSection[];
  currentIndex: number;
  programName: string;
  children: React.ReactNode;
  canContinue: boolean;
  isLastStep: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSaveAndExit: () => void;
  onJumpTo?: (index: number) => void;
  validationError?: string | null;
  savedNotice?: string | null;
  onDismissSaved?: () => void;
}

export function WizardShell({
  sections,
  currentIndex,
  programName,
  children,
  canContinue,
  isLastStep,
  isSaving,
  isSubmitting,
  onBack,
  onContinue,
  onSaveAndExit,
  onJumpTo,
  validationError,
  savedNotice,
  onDismissSaved,
}: WizardShellProps) {
  const percent = Math.round(((currentIndex + 1) / sections.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-[#006AFF]">
                {programName}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                {sections[currentIndex]?.label ?? ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden rounded-full bg-[#006AFF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#006AFF] sm:inline">
                {percent}%
              </span>
              <button
                type="button"
                onClick={onSaveAndExit}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? "Saving…" : "Save & exit"}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1 w-full bg-slate-100"
          >
            <div
              className="h-full bg-gradient-to-r from-[#006AFF] to-[#338bff] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Step list — desktop */}
          <aside className="hidden lg:block">
            <nav className="sticky top-[72px] space-y-1">
              {sections.map((section, index) => {
                const done = index < currentIndex;
                const active = index === currentIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => onJumpTo?.(index)}
                    disabled={!onJumpTo || index > currentIndex}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                      active
                        ? "bg-[#006AFF]/10 font-semibold text-[#006AFF]"
                        : done
                        ? "cursor-pointer font-medium text-slate-700 hover:bg-slate-100"
                        : "cursor-not-allowed text-slate-400"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          active
                            ? "bg-[#006AFF] text-white"
                            : "bg-slate-200 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <div className="space-y-6">
            {/* Content card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              {children}

              {/* Validation error */}
              {validationError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                  {validationError}
                </div>
              )}

              {/* Saved notice */}
              {savedNotice && (
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{savedNotice}</span>
                  <button
                    type="button"
                    onClick={onDismissSaved}
                    className="ml-1 text-emerald-500 hover:text-emerald-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={currentIndex === 0}
                className={cn(
                  "inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition",
                  "hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue || isSubmitting}
                className={cn(
                  "inline-flex min-h-[48px] items-center gap-2 rounded-full px-7 text-sm font-semibold text-white shadow-md transition",
                  "focus:outline-none focus:ring-4 focus:ring-[#006AFF]/30",
                  canContinue && !isSubmitting
                    ? "bg-[#006AFF] shadow-[#006AFF]/25 hover:bg-[#0057e6] hover:shadow-lg"
                    : "cursor-not-allowed bg-slate-300 shadow-none"
                )}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting…
                  </>
                ) : isLastStep ? (
                  <><CheckCircle2 className="h-4 w-4" /> Submit application</>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
