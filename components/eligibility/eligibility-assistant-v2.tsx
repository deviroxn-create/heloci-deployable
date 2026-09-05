"use client";

/**
 * eligibility-assistant-v2.tsx
 *
 * Orchestrator for the conversational Housing Case Worker experience.
 *
 * Architecture:
 *  - conversation-config.ts  → all content, steps, branching rules, messages
 *  - conversation-inputs.tsx → input widgets for each step type
 *  - caseworker-chat.tsx     → AI message bubbles
 *  - stage-progress.tsx      → stage-aware progress bar
 *  - completion-summary.tsx  → final profile + matches summary
 *  - question-inputs.tsx     → low-level input primitives (unchanged)
 *  - profile-sidebar.tsx     → right sidebar (unchanged)
 *
 * Data flow:
 *  answers[step.id] → persisted to /api/applicant-profile via step.profileKey mapping
 *  DB eligibility engine is NOT modified — answers are mapped to the same profile keys.
 */

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { RenderedQuestion } from "@/lib/forms/renderer";
import { ProfileSidebar } from "./profile-sidebar";
import { StageProgress } from "./stage-progress";
import { CaseworkerChat } from "./caseworker-chat";
import { ConversationInput } from "./conversation-inputs";
import { CompletionSummary } from "./completion-summary";
import {
  CASEWORKER_MESSAGES,
  CONVERSATION_STAGES,
  getFlatSteps,
  getStageProgress,
  shouldShowStep,
  type ConversationStep,
} from "./conversation-config";

/* ─── Types ─────────────────────────────────────────────────── */

export interface EligibilityAssistantV2Props {
  /** Pages from the DB-driven form engine — used to merge any program-specific
   *  questions that aren't covered by the built-in conversation config.        */
  pages: Array<{ id: string; title: string; questions: RenderedQuestion[] }>;
  userName?: string | null;
  isGuest?: boolean;
  onComplete?: () => void;
}

type GuestEligibilityMatch = {
  programId: string;
  programName: string;
  programSlug: string;
  isEligible: boolean;
  score?: number;
};

/* ─── Constants ──────────────────────────────────────────────── */

const DRAFT_KEY = "heloci-eligibility-draft-v2";

/** Insert the recommendation preview after ~30% of steps */
const PREVIEW_THRESHOLD = 0.3;

/* ─── Helpers ────────────────────────────────────────────────── */

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (i === parts.length - 1) {
      cur[p] = value;
    } else {
      if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
      cur = cur[p] as Record<string, unknown>;
    }
  }
}

function normalizeAnswer(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) return value.length ? value.map(String) : undefined;
  return value;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function canContinueStep(step: ConversationStep, value: unknown): boolean {
  if (step.inputType === "info") return true;
  if (step.inputType === "recommendation_preview") return true;
  if (!step.required) return true;
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) {
    return value.length >= (step.minSelections ?? 1);
  }
  return true;
}

/* ─── Welcome screen ─────────────────────────────────────────── */

function WelcomeScreen({
  userName,
  onStart,
}: {
  userName: string;
  onStart: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#006AFF]/20 to-[#338bff]/10 shadow-lg">
          <Sparkles className="h-9 w-9 text-[#006AFF]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#006AFF]">
          Heloci Housing Case Worker
        </p>
        <h1 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
          Hi {userName} 👋
        </h1>
        <div className="mx-auto max-w-md space-y-4 text-left rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm leading-7">
          <p>
            I'm your Housing Case Worker. I'll help you discover housing programs across the
            United States that may be a good fit for your situation.
          </p>
          <p>
            Most applicants finish in about <strong className="text-slate-900">8 minutes</strong>.
            If you're unsure about any answer, you can skip it and update your profile later.
          </p>
          <p>
            My recommendations are advisory — you're always welcome to apply to any program.
            Final eligibility is determined by the housing provider after reviewing your application.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["⚡ About 8 minutes", "🔒 Your data stays private", "💾 Auto-saved", "📋 No commitment"].map((pill) => (
            <span key={pill} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {pill}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex min-h-[56px] min-w-[220px] items-center justify-center gap-2 rounded-full bg-[#006AFF] px-8 text-base font-semibold text-white shadow-lg shadow-[#006AFF]/30 transition hover:bg-[#0057e6] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#006AFF]/30"
        >
          Let's get started <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-sm text-slate-400">
          Already started?{" "}
          <span className="font-medium text-[#006AFF]">Your progress will be restored.</span>
        </p>
      </div>
    </div>
  );
}

/* ─── Stage transition banner ────────────────────────────────── */

function StageTransitionBanner({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#006AFF]/15 bg-gradient-to-r from-[#f0f7ff] to-white px-5 py-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#006AFF]" />
        <p className="text-sm font-medium leading-6 text-slate-700">{text}</p>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

export default function EligibilityAssistantV2({
  pages,
  userName: initialUserName,
  isGuest = false,
  onComplete,
}: EligibilityAssistantV2Props) {
  const router = useRouter();

  /* ── State ── */
  const [showWelcome, setShowWelcome]   = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stepIndex, setStepIndex]       = useState(0);
  const [answers, setAnswers]           = useState<Record<string, unknown>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [userName, setUserName]         = useState(initialUserName ?? "there");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [prevStageId, setPrevStageId]   = useState<string | null>(null);
  const [guestMatches, setGuestMatches] = useState<GuestEligibilityMatch[] | null>(null);

  const questionAreaRef = useRef<HTMLDivElement>(null);

  /* ── Derive visible steps from config ── */
  const allConfigSteps = useMemo(() => getFlatSteps(), []);

  const visibleSteps = useMemo((): ConversationStep[] => {
    const filtered = allConfigSteps.filter((step) => shouldShowStep(step, answers));

    // Inject recommendation preview after ~30% if we haven't already
    const previewStep = allConfigSteps.find((s) => s.id === "recommendation_preview.panel");
    const alreadyIn = filtered.some((s) => s.id === "recommendation_preview.panel");

    if (previewStep && !alreadyIn) {
      const threshold = Math.floor(filtered.length * PREVIEW_THRESHOLD);
      filtered.splice(threshold, 0, previewStep);
    }

    return filtered;
  }, [allConfigSteps, answers]);

  const currentStep = visibleSteps[stepIndex] ?? null;
  const currentValue = currentStep ? answers[currentStep.id] : undefined;
  const totalSteps = visibleSteps.length;
  const canContinue = currentStep ? canContinueStep(currentStep, currentValue) : false;

  const stageInfo = useMemo(
    () => (currentStep ? getStageProgress(currentStep.id) : { stageIndex: 0, totalStages: CONVERSATION_STAGES.length, stageLabel: "" }),
    [currentStep]
  );

  const caseworkerMessage = currentStep
    ? (CASEWORKER_MESSAGES[currentStep.id] ?? {
        message: "This helps me find the best matching programs for your situation.",
        tone: "standard" as const,
      })
    : null;

  const answeredCount = useMemo(
    () => visibleSteps.filter((s) => {
      const v = answers[s.id];
      return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    }).length,
    [visibleSteps, answers]
  );

  const completionScore = totalSteps > 0 ? Math.round((answeredCount / totalSteps) * 100) : 0;
  const minutesLeft = Math.max(1, Math.ceil((totalSteps - stepIndex) * 0.25));

  /* ── Detect stage change ── */
  const currentStageId = currentStep
    ? CONVERSATION_STAGES.find((s) => s.id === currentStep.stage)?.id ?? null
    : null;

  const isNewStage = currentStageId !== null && currentStageId !== prevStageId;
  const currentStageObj = currentStageId
    ? CONVERSATION_STAGES.find((s) => s.id === currentStageId) ?? null
    : null;

  /* ── Restore from localStorage + API ── */
  useEffect(() => {
    async function restore() {
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { answers?: Record<string, unknown>; stepIndex?: number };
          if (parsed?.answers) setAnswers(parsed.answers);
          if (typeof parsed?.stepIndex === "number" && parsed.stepIndex > 0) {
            setStepIndex(parsed.stepIndex);
            setShowWelcome(false);
          }
        }
      } catch { /* ignore */ }

      if (!isGuest) {
        try {
          const res = await fetch("/api/eligibility/progress");
          if (!res.ok) return;
          const data = await res.json().catch(() => ({})) as Record<string, unknown>;
          if (data?.answers && typeof data.answers === "object") {
            setAnswers((prev) => ({ ...prev, ...(data.answers as Record<string, unknown>) }));
          }
          if (typeof data?.currentIndex === "number" && data.currentIndex > 0) {
            setStepIndex(data.currentIndex);
            setShowWelcome(false);
          }
          if (typeof data?.userName === "string") setUserName(data.userName);
        } catch { /* ignore */ }
      }
    }
    void restore();
  }, [isGuest]);

  /* ── Persist on change ── */
  useEffect(() => {
    if (showWelcome) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, stepIndex }));
    } catch { /* ignore */ }
    if (isGuest) return;
    void fetch("/api/eligibility/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentIndex: stepIndex, answers }),
    }).catch(() => undefined);
  }, [answers, stepIndex, showWelcome, isGuest]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (!showWelcome && questionAreaRef.current) {
      questionAreaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stepIndex, showWelcome]);

  /* ── Track stage changes ── */
  useEffect(() => {
    if (currentStageId && currentStageId !== prevStageId) {
      setPrevStageId(currentStageId);
    }
  }, [currentStageId, prevStageId]);

  /* ── Keyboard shortcut ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleContinue();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ── Build API payload from answers ── */
  async function persistAnswers(): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {};
    const metaAnswers: Record<string, unknown> = {};

    for (const step of visibleSteps) {
      const raw = answers[step.id];
      const normalized = normalizeAnswer(raw);
      if (normalized === undefined) continue;

      metaAnswers[step.id] = normalized;

      const profileKey = step.profileKey;
      if (!profileKey) continue;

      // Special handling for housing goals → preferences.housingGoal
      if (step.id === "intention.housingGoals") {
        const goals = Array.isArray(normalized)
          ? normalized.filter((v): v is string => typeof v === "string")
          : typeof normalized === "string"
          ? [normalized]
          : [];
        if (goals.length) {
          payload.preferences = { ...((payload.preferences as object) ?? {}), housingGoal: goals.join(", ") };
        }
        continue;
      }

      // Special handling for preferred locations
      if (step.id === "preferences.states") {
        payload.preferences = { ...((payload.preferences as object) ?? {}), preferredLocations: normalized };
        continue;
      }

      if (profileKey.includes(".")) {
        setNested(payload, profileKey, normalized);
      } else {
        payload[profileKey] = normalized;
      }
    }

    if (Object.keys(metaAnswers).length) {
      payload.meta = { ...((payload.meta as object) ?? {}), answers: metaAnswers };
    }

    if (isGuest) return payload;

    const res = await fetch("/api/applicant-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(d.error ?? "Unable to save answers.");
    }
    return payload;
  }

  /* ── Handlers ── */

  function updateAnswer(value: unknown) {
    if (!currentStep) return;
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }));
    setValidationError(null);
  }

  function handleBack() {
    setValidationError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleContinue() {
    if (!currentStep) return;
    if (!canContinueStep(currentStep, currentValue)) {
      setValidationError("Please answer this question to continue.");
      return;
    }
    setValidationError(null);
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    } else {
      void handleFinish();
    }
  }

  async function handleFinish() {
    setIsSubmitting(true);
    setValidationError(null);
    try {
      const payload = await persistAnswers();
      if (isGuest) {
        const res = await fetch("/api/eligibility/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({})) as { error?: string; results?: GuestEligibilityMatch[] };
        if (!res.ok) throw new Error(data.error ?? "Eligibility check failed.");
        setGuestMatches(data.results ?? []);
      } else {
        const res = await fetch("/api/matches/refresh", { method: "POST" });
        const data = await res.json().catch(() => ({})) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Eligibility check failed.");
      }
      try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setShowCompletion(true);
      onComplete?.();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveAndExit() {
    setIsSaving(true);
    try {
      await persistAnswers();
      setDraftSavedAt(formatTimestamp(new Date()));
    } catch { /* silent */ }
    finally { setIsSaving(false); }
  }

  async function handleSaveAndNavigate() {
    await handleSaveAndExit();
    router.push("/applicant/dashboard");
  }

  /* ── Empty state ── */
  if (!allConfigSteps.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Home className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">No questions available yet</h2>
          <p className="mt-2 text-slate-600">We're still setting up the eligibility flow. Check back soon or browse programs now.</p>
        </div>
        <a href="/apply" className="inline-flex items-center gap-2 rounded-full bg-[#006AFF] px-6 py-3 font-semibold text-white transition hover:bg-[#0057e6]">
          Browse programs <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  /* ── Welcome ── */
  if (showWelcome) {
    return <WelcomeScreen userName={userName} onStart={() => setShowWelcome(false)} />;
  }

  /* ── Completion summary ── */
  if (showCompletion) {
    return (
      <CompletionSummary
        answers={answers}
        initialMatches={guestMatches ?? undefined}
        isGuest={isGuest}
        onViewMatches={() => {
          router.push(isGuest ? "/register" : "/matches/results");
        }}
        onSaveAndExit={() => {
          if (isGuest) {
            router.push("/register");
            return;
          }
          void handleSaveAndNavigate();
        }}
      />
    );
  }

  if (!currentStep) return null;

  /* ── Interview UI ── */
  return (
    <div className="min-h-screen">
      {/* Sticky progress bar */}
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8">
        <div className="mx-auto max-w-6xl">
          <StageProgress
            stageIndex={stageInfo.stageIndex}
            totalStages={stageInfo.totalStages}
            stageLabel={stageInfo.stageLabel}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8" ref={questionAreaRef}>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* Left: conversation */}
          <div className="space-y-5">
            {/* Stage transition banner */}
            {isNewStage && currentStageObj?.transition && (
              <StageTransitionBanner text={currentStageObj.transition} />
            )}

            {/* Caseworker chat */}
            {caseworkerMessage && currentStep.inputType !== "info" && (
              <CaseworkerChat
                stepId={currentStep.id}
                message={caseworkerMessage}
                stageLabel={stageInfo.stageLabel}
                animateKey={currentStep.id}
              />
            )}

            {/* Question card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="space-y-3">
                {currentStep.inputType !== "info" && currentStep.inputType !== "recommendation_preview" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#006AFF]/10 px-3 py-1 text-xs font-semibold text-[#006AFF]">
                    <Sparkles className="h-3 w-3" />
                    {stageInfo.stageLabel}
                  </span>
                )}

                <h2 className="text-2xl font-bold leading-snug text-slate-950 sm:text-3xl">
                  {currentStep.question}
                </h2>

                {currentStep.inputType === "info" && currentStep.subtext && (
                  <div className="text-base leading-8 text-slate-600 space-y-3">
                    {currentStep.subtext.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}

                {currentStep.inputType !== "info" && currentStep.subtext && (
                  <p className="text-base leading-7 text-slate-500">{currentStep.subtext}</p>
                )}
              </div>

              {/* Input */}
              {currentStep.inputType !== "info" && (
                <div className="mt-8">
                  <ConversationInput
                    step={currentStep}
                    value={currentValue}
                    onChange={updateAnswer}
                  />
                </div>
              )}

              {/* Validation error */}
              {validationError && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Draft saved notice */}
              {draftSavedAt && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Progress saved at {draftSavedAt}</span>
                  <button type="button" onClick={() => setDraftSavedAt(null)} aria-label="Dismiss" className="ml-1 text-emerald-500 hover:text-emerald-700">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Action bar */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={stepIndex === 0}
                  className={cn(
                    "inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition",
                    "hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                    "disabled:cursor-not-allowed disabled:opacity-40"
                  )}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAndNavigate}
                    disabled={isSaving}
                    className={cn(
                      "inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition",
                      "hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30 disabled:opacity-50"
                    )}
                  >
                    {isSaving ? "Saving…" : "Save & exit"}
                  </button>

                  <button
                    type="button"
                    onClick={handleContinue}
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
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Running…</>
                    ) : stepIndex === totalSteps - 1 ? (
                      <><CheckCircle2 className="h-4 w-4" />Finish & see results</>
                    ) : currentStep.inputType === "info" ? (
                      <>Let's begin<ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <>Continue<ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs">Ctrl</kbd>{" + "}
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to continue
              </p>
            </div>
          </div>

          {/* Right: sidebar (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-[88px]">
              <ProfileSidebar
                completionScore={completionScore}
                answeredCount={answeredCount}
                totalCount={totalSteps}
                draftSavedAt={draftSavedAt}
                estimatedMinutesLeft={minutesLeft}
                onSaveAndExit={handleSaveAndExit}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Toggle progress panel"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#006AFF] text-white shadow-lg shadow-[#006AFF]/30 transition hover:bg-[#0057e6]"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Your progress</p>
              <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <ProfileSidebar
              completionScore={completionScore}
              answeredCount={answeredCount}
              totalCount={totalSteps}
              draftSavedAt={draftSavedAt}
              estimatedMinutesLeft={minutesLeft}
              onSaveAndExit={async () => { await handleSaveAndNavigate(); setSidebarOpen(false); }}
              isSaving={isSaving}
            />
          </div>
        </>
      )}
    </div>
  );
}
