"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildZodSchema } from "@/lib/forms/validator";
import type { RenderedQuestion } from "@/lib/forms/renderer";

const UNSURE_VALUES = new Set(["not_sure", "other", "prefer_not_to_say"]);

interface InterviewProps {
  pages: Array<{ id: string; title: string; questions: RenderedQuestion[] }>;
  onComplete?: () => void;
}

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
    if (!trimmed) return "";
    return trimmed;
  }

  if (value == null) return "";
  return String(value);
}

function isChoiceQuestion(question: RenderedQuestion) {
  const type = question.type?.toLowerCase() ?? "text";
  return type === "select" || type === "boolean" || type === "multiselect" || type === "radio" || type === "checkbox";
}

export default function EligibilityInterview({ pages, onComplete }: InterviewProps) {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentPage = pages[pageIndex];
  const schema = useMemo(() => buildZodSchema(currentPage?.questions ?? []), [currentPage]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries((currentPage?.questions ?? []).map((q) => [q.key, q.value ?? ""]))
  });

  useEffect(() => {
    form.reset(Object.fromEntries((currentPage?.questions ?? []).map((q) => [q.key, q.value ?? ""])));
  }, [currentPage]);

  async function saveAnswers(values: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      // Map flat question keys like 'personal.fullName' -> nested object for applicant-profile
      const payload: Record<string, any> = {};
      const answers: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(values)) {
        const normalizedValue = normalizeAnswer(value);
        if (key.includes(".")) {
          setNested(payload, key, normalizedValue);
        } else {
          payload[key] = normalizedValue;
        }
        answers[key] = normalizedValue;
      }

      if (Object.keys(answers).length > 0) {
        payload.meta = { ...(payload.meta ?? {}), answers };
      }

      await fetch("/api/applicant-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      setMessage((err as Error).message || "Unable to save answers.");
    } finally {
      setSaving(false);
    }
  }

  async function handleNext(values: Record<string, unknown>) {
    await saveAnswers(values);
    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    try {
      // Run eligibility engine and then navigate to matches
      const resp = await fetch("/api/matches/refresh", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Unable to run eligibility check.");
      onComplete?.();
      router.push("/matches");
    } catch (err) {
      setMessage((err as Error).message || "Eligibility evaluation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentPage) return <div className="text-sm text-slate-600">No interview questions available.</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Step {pageIndex + 1} of {pages.length}</span>
          <span>{Math.round(((pageIndex + 1) / pages.length) * 100)}%</span>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">{currentPage.title}</h2>
        <form onSubmit={form.handleSubmit(handleNext)} className="mt-6 space-y-4">
          {currentPage.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label htmlFor={question.key} className="text-sm font-medium text-slate-800">{question.label}</label>
              {question.helpText ? <p className="text-sm text-slate-500">{question.helpText}</p> : null}
              {isChoiceQuestion(question) ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options?.map((opt) => {
                    const selected = form.watch(question.key) === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => form.setValue(question.key, opt.value, { shouldValidate: true, shouldDirty: true })}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${selected ? "border-[#006AFF] bg-[#006AFF]/10 text-[#006AFF]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => form.setValue(question.key, "not_sure", { shouldValidate: true, shouldDirty: true })}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${form.watch(question.key) === "not_sure" ? "border-[#006AFF] bg-[#006AFF]/10 text-[#006AFF]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  >
                    Not sure
                  </button>
                </div>
              ) : question.type === "textarea" ? (
                <textarea id={question.key} {...form.register(question.key)} className="min-h-24 w-full rounded-3xl border border-border bg-white px-4 py-3" />
              ) : question.type === "boolean" ? (
                <div className="flex gap-3">
                  <button type="button" onClick={() => form.setValue(question.key, "true", { shouldValidate: true, shouldDirty: true })} className={`rounded-2xl border px-4 py-3 text-sm font-medium ${form.watch(question.key) === "true" ? "border-[#006AFF] bg-[#006AFF]/10 text-[#006AFF]" : "border-slate-200 bg-white text-slate-700"}`}>
                    Yes
                  </button>
                  <button type="button" onClick={() => form.setValue(question.key, "false", { shouldValidate: true, shouldDirty: true })} className={`rounded-2xl border px-4 py-3 text-sm font-medium ${form.watch(question.key) === "false" ? "border-[#006AFF] bg-[#006AFF]/10 text-[#006AFF]" : "border-slate-200 bg-white text-slate-700"}`}>
                    No
                  </button>
                  <button type="button" onClick={() => form.setValue(question.key, "not_sure", { shouldValidate: true, shouldDirty: true })} className={`rounded-2xl border px-4 py-3 text-sm font-medium ${form.watch(question.key) === "not_sure" ? "border-[#006AFF] bg-[#006AFF]/10 text-[#006AFF]" : "border-slate-200 bg-white text-slate-700"}`}>
                    Not sure
                  </button>
                </div>
              ) : (
                <input id={question.key} type="text" {...form.register(question.key)} className="w-full rounded-3xl border border-border bg-white px-4 py-3 text-slate-900" />
              )}
              {form.formState.errors[question.key] ? <p className="text-sm text-red-600">{form.formState.errors[question.key]?.message as string}</p> : null}
            </div>
          ))}

          {message ? <p className="text-sm text-red-600">{message}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={pageIndex === 0}>
              Back
            </Button>
            <Button type="submit" disabled={saving || submitting} className="bg-[#006AFF] text-white hover:bg-[#0057e6]">
              {pageIndex === pages.length - 1 ? (submitting ? "Running…" : "Finish and check eligibility") : (saving ? "Saving…" : "Continue")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
