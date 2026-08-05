"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RenderedQuestion } from "@/lib/forms/renderer";
import AIIntro from "@/components/AIIntro";
import QuestionCard from "@/components/QuestionCard";
import { canContinueQuestion, shouldShowQuestion } from "@/lib/eligibility/conditional";
import { createFieldSchema } from "@/lib/forms/validator";

interface InterviewProps {
  pages: Array<{ id: string; title: string; questions: RenderedQuestion[] }>;
  userName?: string | null;
  onComplete?: () => void;
}

const DRAFT_STORAGE_KEY = "heloci-eligibility-draft";

function setNested(obj: Record<string, any>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      cur[p] = value;
    } else {
      if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
      cur = cur[p];
    }
  }
}

function normalizeAnswer(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed;
  }

  if (value == null) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item));
  return value;
}

function getInitialValue(question: RenderedQuestion, fallback: unknown) {
  if (question.type === "multiselect") {
    return Array.isArray(fallback) ? fallback : [];
  }

  if (fallback === undefined || fallback === null) {
    return question.value === undefined ? undefined : question.value;
  }

  return fallback;
}

export default function EligibilityAssistant({ pages, userName: initialUserName, onComplete }: InterviewProps) {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [restoredAnswers, setRestoredAnswers] = useState<Record<string, unknown>>({});
  const [userName, setUserName] = useState("there");

  const allQuestions = useMemo(() => {
    return pages
      .flatMap((page) => page.questions)
      .map((question, index) => ({ ...question, order: index }))
      .sort((a, b) => ((a as RenderedQuestion & { order?: number }).order ?? 0) - ((b as RenderedQuestion & { order?: number }).order ?? 0));
  }, [pages]);

  const visibleQuestions = useMemo(() => {
    return allQuestions.filter((question) => shouldShowQuestion(question as any, answers));
  }, [allQuestions, answers]);

  const currentQuestion = visibleQuestions[currentQuestionIndex] ?? null;
  const currentQuestionValue = currentQuestion ? answers[currentQuestion.key] : undefined;
  const totalQuestions = visibleQuestions.length;
  const progressPercent = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const canContinue = Boolean(currentQuestion && canContinueQuestion(currentQuestion as any, currentQuestionValue));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setRestoredAnswers(parsed as Record<string, unknown>);
        }
      }
      const displayName = initialUserName || window.localStorage.getItem("heloci-user-name") || "there";
      setUserName(displayName);
    } catch {
      // Ignore local storage issues and continue with the interview.
    }
  }, [initialUserName]);

  useEffect(() => {
    let ignore = false;

    async function restoreProgress() {
      try {
        const response = await fetch("/api/eligibility/progress");
        if (!response.ok || ignore) {
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (ignore) {
          return;
        }

        if (data?.answers && typeof data.answers === "object") {
          setRestoredAnswers(data.answers as Record<string, unknown>);
        }

        if (typeof data?.currentIndex === "number") {
          setCurrentQuestionIndex(Math.max(0, data.currentIndex));
        }

        if (typeof data?.userName === "string") {
          setUserName(data.userName);
        }

        if (data?.currentIndex || (data?.answers && Object.keys(data.answers as Record<string, unknown>).length > 0)) {
          setShowIntro(false);
        }
      } catch {
        // Ignore progress restoration issues and continue with the intro.
      }
    }

    void restoreProgress();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (Object.keys(restoredAnswers).length > 0) {
      setAnswers((previous) => ({ ...previous, ...restoredAnswers }));
    }
  }, [restoredAnswers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...restoredAnswers, ...answers }));
    } catch {
      // Ignore local storage issues and continue with the interview.
    }
  }, [answers, restoredAnswers]);

  useEffect(() => {
    if (!showIntro && currentQuestion) {
      void fetch("/api/eligibility/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey: currentQuestion.key, answer: answers[currentQuestion.key], currentIndex: currentQuestionIndex })
      }).catch(() => undefined);
    }
  }, [answers, currentQuestion, currentQuestionIndex, showIntro]);

  function validateQuestionValue(question: RenderedQuestion, value: unknown) {
    const fieldSchema = createFieldSchema(question);
    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? "Please answer this question.");
      return false;
    }

    setMessage(null);
    return true;
  }

  async function saveAnswers(values: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    setSavedNotice(null);
    try {
      const payload: Record<string, any> = {};
      const answersToSave: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(values)) {
        const normalizedValue = normalizeAnswer(value);
        if (normalizedValue !== undefined) {
          if (key === "housingGoals" || key === "housingGoal") {
            const selectedGoals = Array.isArray(normalizedValue)
              ? normalizedValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
              : typeof normalizedValue === "string" && normalizedValue.trim()
                ? [normalizedValue.trim()]
                : [];
            if (selectedGoals.length > 0) {
              payload.preferences = { ...(payload.preferences ?? {}), housingGoal: selectedGoals.join(", ") };
            }
          }

          if (key.includes(".")) {
            setNested(payload, key, normalizedValue);
          } else {
            payload[key] = normalizedValue;
          }
          answersToSave[key] = normalizedValue;
        }
      }

      const mergedDraft = { ...restoredAnswers, ...answersToSave };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(mergedDraft));

      if (Object.keys(answersToSave).length > 0) {
        payload.meta = { ...(payload.meta ?? {}), answers: answersToSave };
      }

      const response = await fetch("/api/applicant-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to save answers.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save answers.");
    } finally {
      setSaving(false);
    }
  }

  async function handleContinue() {
    if (!currentQuestion) return;
    if (!validateQuestionValue(currentQuestion, currentQuestionValue)) {
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((index) => index + 1);
      return;
    }

    setSubmitting(true);
    try {
      await saveAnswers(answers);
      const response = await fetch("/api/matches/refresh", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data as { error?: string }).error || "Unable to run eligibility check.");
      onComplete?.();
      router.push("/matches/results");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Eligibility evaluation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((index) => index - 1);
    }
  }

  function updateAnswer(value: unknown) {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.key]: value }));
    setMessage(null);
  }

  if (!pages.length) {
    return <div className="text-sm text-slate-600">No interview questions available.</div>;
  }

  if (showIntro) {
    return (
      <div className="space-y-6">
        <AIIntro userName={userName} onStart={() => setShowIntro(false)} />
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-sm text-slate-600">No interview questions available.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200">
          <div className={`h-2 rounded-full bg-[#006AFF] transition-all ${progressPercent <= 0 ? "w-0" : progressPercent <= 25 ? "w-1/4" : progressPercent <= 50 ? "w-1/2" : progressPercent <= 75 ? "w-3/4" : "w-full"}`} />
        </div>
      </div>

      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">Heloci Housing Assistant</p>
        <h2 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{currentQuestion.label}</h2>
        {currentQuestion.helpText ? <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600">{currentQuestion.helpText}</p> : null}
      </div>

      <Card className="border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-5">
          <QuestionCard question={currentQuestion} value={currentQuestionValue} onChange={updateAnswer} />

          {message ? <p className="text-sm text-red-600">{message}</p> : null}
          {savedNotice ? <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{savedNotice}</p> : null}

          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0} className="min-h-[44px] px-5">
              Back
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const payload = { ...answers, [currentQuestion.key]: currentQuestionValue };
                  await saveAnswers(payload);
                  setSavedNotice("Your progress is safely saved and can be resumed later.");
                }}
                disabled={saving}
                className="min-h-[44px] px-5"
              >
                {saving ? "Saving…" : "Save progress"}
              </Button>
              <Button type="button" onClick={handleContinue} disabled={!canContinue || saving || submitting} className="min-h-[44px] bg-[#006AFF] px-5 text-white hover:bg-[#0057e6]">
                {submitting ? "Running…" : currentQuestionIndex === totalQuestions - 1 ? "Finish and check eligibility" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
