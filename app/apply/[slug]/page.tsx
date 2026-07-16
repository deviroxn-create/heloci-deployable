"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DynamicForm from "@/components/DynamicForm";
import { Card } from "@/components/ui/card";

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<{ pages: Array<{ id: string; title: string; questions: Array<{ id: string; key: string; label: string; type: string; required: boolean; value: unknown; visible: boolean; options?: Array<{ value: string; label: string }>; validation?: Record<string, unknown>; helpText?: string }> }>; applicationId: string; currentPage: number; totalPages: number; programName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/programs/${params.slug}/form`);
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to load this form.");
        setLoading(false);
        return;
      }
      setData(result);
      setLoading(false);
    }

    if (params.slug) {
      loadForm();
    }
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-700">Loading form…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]">
        <Card className="mx-auto max-w-3xl p-8">
          <h1 className="text-2xl font-semibold">We could not load this application</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <button type="button" className="mt-6 text-sm font-semibold text-[#006AFF]" onClick={() => router.push("/matches")}>Return to matches</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]">
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-[16px] p-8 shadow-soft">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">Program application</p>
            <h1 className="text-3xl font-semibold text-slate-950">{data?.programName}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Complete the questions below to submit your application.</p>
          </div>
          {data ? <DynamicForm pages={data.pages} applicationId={data.applicationId} initialPage={data.currentPage} onComplete={() => router.push("/dashboard")} /> : null}
        </Card>
      </div>
    </div>
  );
}
