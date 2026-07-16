"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadApplicantProfile } from "@/services/applicant-profile.service";

type Question = {
  id: string;
  key: string;
  label: string;
  type: string;
  options: Array<{ value: string; label: string }> | null;
};

type FormValues = Record<string, string | number | null>;

function normalizeQuestionOptions(options: unknown): Array<{ value: string; label: string }> {
  if (Array.isArray(options)) {
    return options
      .filter((option): option is Record<string, unknown> => Boolean(option) && typeof option === "object")
      .map((option) => ({
        value: String(option.value ?? ""),
        label: String(option.label ?? option.value ?? "")
      }))
      .filter((option) => option.value);
  }

  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options) as Array<Record<string, unknown>>;
      return parsed
        .map((option) => ({
          value: String(option.value ?? ""),
          label: String(option.label ?? option.value ?? "")
        }))
        .filter((option) => option.value);
    } catch {
      return [];
    }
  }

  return [];
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [profileSummary, setProfileSummary] = useState<{ score: number; status: string; completedSections: string[] } | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    setGoal(searchParams.get("goal") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("id,key,label,type,options")
        .eq("is_universal", true)
        .order("key", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const normalizedQuestions = (data ?? []).map((item: any) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        type: item.type,
        options: normalizeQuestionOptions(item.options)
      }));

      setQuestions(normalizedQuestions);

      try {
        const profile = await loadApplicantProfile(user.id);
        const legacyPayload = Object.fromEntries(
          Object.entries(profile).flatMap(([section, value]) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
              return Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [`${section}.${key}`, nestedValue]);
            }
            return [];
          })
        );
        reset(legacyPayload as FormValues);
      } catch {
        // Fall back to the existing form state if loading from the consolidated service fails.
      }

      try {
        const response = await fetch("/api/applicant-profile", { method: "GET" });
        if (response.ok) {
          const payload = await response.json();
          setProfileSummary(payload.completeness ?? null);
        }
      } catch {
        // Ignore summary load errors and keep the existing flow working.
      }

      setLoading(false);
    };

    fetchQuestions();
  }, [reset, router]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setError(null);

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/applicant-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal: {
            fullName: typeof values.full_name === "string" ? values.full_name : undefined,
            phone: typeof values.phone === "string" ? values.phone : undefined
          },
          preferences: {
            housingGoal: goal || undefined,
            preferredLocations: []
          },
          meta: {
            lastUpdatedAt: new Date().toISOString(),
            version: 1
          }
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to save your structured profile.");
      }

      router.push("/matches");
    } catch (err) {
      setError((err as Error).message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl text-center text-slate-700">Loading your profile questions…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]">
      <div className="mx-auto max-w-3xl">
        <Card className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">Complete your Heloci profile</h1>
            <p className="mt-2 text-sm text-slate-600">Answer a few universal questions to determine your housing eligibility and build your reusable applicant profile.</p>
            {profileSummary ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Profile progress: {profileSummary.score}%</p>
                <p className="mt-1">Status: {profileSummary.status}</p>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label htmlFor={question.key} className="block text-sm font-medium text-[#2D323C]">
                  {question.label}
                </label>

                {question.type === "select" ? (
                  <select
                    id={question.key}
                    {...register(question.key)}
                    className="w-full rounded-3xl border border-border bg-white px-4 py-3 text-slate-900 outline-none"
                  >
                    <option value="">Select an option</option>
                    {question.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={question.key}
                    type={question.type === "number" ? "number" : "text"}
                    {...register(question.key, {
                      setValueAs: (value) => {
                        if (question.type === "number") {
                          return value === "" ? null : Number(value);
                        }
                        return value;
                      }
                    })}
                  />
                )}
              </div>
            ))}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Goal: {goal || "Not selected"}</p>
              <Button type="submit" disabled={saving || loading} className="rounded-3xl bg-[#006AFF] text-white hover:bg-[#0057e6]">
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-10"><div className="mx-auto max-w-3xl text-center text-slate-700">Loading your profile…</div></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
