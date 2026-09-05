"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildZodSchema } from "@/lib/forms/validator";
import type { RenderedQuestion } from "@/lib/forms/renderer";

interface DynamicFormProps {
  pages: Array<{ id: string; title: string; questions: RenderedQuestion[] }>;
  applicationId: string;
  initialPage?: number;
  onComplete?: () => void;
}

export default function DynamicForm({ pages, applicationId, initialPage = 0, onComplete }: DynamicFormProps) {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const currentPage = pages[pageIndex];

  const schema = useMemo(() => buildZodSchema(currentPage?.questions ?? []), [currentPage]);
  const progressPercent = Math.max(0, Math.min(100, Math.round(((pageIndex + 1) / Math.max(pages.length, 1)) * 100)));
  const progressWidthClass =
    progressPercent <= 0 ? "w-0" :
    progressPercent <= 25 ? "w-1/4" :
    progressPercent <= 50 ? "w-1/2" :
    progressPercent <= 75 ? "w-3/4" : "w-full";

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries((currentPage?.questions ?? []).map((question) => [question.key, question.value ?? ""]))
  });

  useEffect(() => {
    form.reset(Object.fromEntries((currentPage?.questions ?? []).map((question) => [question.key, question.value ?? ""])));
  }, [currentPage, form]);

  async function saveDraft(values: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      await fetch(`/api/applications/${applicationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageData: values, currentPage: pageIndex + 1 })
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleNext(values: Record<string, unknown>) {
    await saveDraft(values);
    if (pageIndex < pages.length - 1) {
      setPageIndex((value) => value + 1);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to submit application.");
      }
      onComplete?.();
      router.push("/applicant/dashboard");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentPage) {
    return <div className="text-sm text-slate-600">No questions available for this program yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Step {pageIndex + 1} of {pages.length}</span>
          <span>{Math.round(((pageIndex + 1) / pages.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div className={`h-2 rounded-full bg-[#006AFF] ${progressWidthClass}`} />
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">{currentPage.title}</h2>
        <form onSubmit={form.handleSubmit(handleNext)} className="mt-6 space-y-4">
          {currentPage.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label htmlFor={question.key} className="text-sm font-medium text-slate-800">{question.label}</label>
              {question.helpText ? <p className="text-sm text-slate-500">{question.helpText}</p> : null}
              {question.type === "select" ? (
                <select id={question.key} {...form.register(question.key)} className="w-full rounded-3xl border border-border bg-white px-4 py-3 text-slate-900">
                  <option value="">Select an option</option>
                  {question.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : question.type === "textarea" ? (
                <textarea id={question.key} {...form.register(question.key)} className="min-h-24 w-full rounded-3xl border border-border bg-white px-4 py-3" />
              ) : question.type === "number" ? (
                <Input id={question.key} type="number" {...form.register(question.key)} />
              ) : question.type === "boolean" ? (
                <input id={question.key} type="checkbox" {...form.register(question.key)} className="h-4 w-4 rounded border-slate-300" />
              ) : question.type === "date" ? (
                <Input id={question.key} type="date" {...form.register(question.key)} />
              ) : question.type === "file" ? (
                <Input id={question.key} type="file" {...form.register(question.key)} />
              ) : (
                <Input id={question.key} type="text" {...form.register(question.key)} />
              )}
              {form.formState.errors[question.key] ? <p className="text-sm text-red-600">{form.formState.errors[question.key]?.message as string}</p> : null}
            </div>
          ))}

          {message ? <p className="text-sm text-red-600">{message}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0}>
              Back
            </Button>
            <Button type="submit" disabled={submitting || saving} className="bg-[#006AFF] text-white hover:bg-[#0057e6]">
              {pageIndex === pages.length - 1 ? (submitting ? "Submitting…" : "Submit Application") : (saving ? "Saving…" : "Continue")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
