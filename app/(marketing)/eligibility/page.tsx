"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/shared/page-shell";
import { ShieldCheck, FileText, Clock3 } from "lucide-react";
import type { MatchResult, ProgramMatch } from "@/lib/matching/engine";

const criteria = [
  {
    title: "Household qualifications",
    description: "Income limits, household size, veteran status, and local program priorities determine the right match for support.",
    icon: ShieldCheck
  },
  {
    title: "Document checklist",
    description: "Clear requirements for ID, income proofs, residency, and case notes reduce uncertainty before applying.",
    icon: FileText
  },
  {
    title: "Application timeline",
    description: "Automated updates keep you informed at every step from review to approval or follow-up requests.",
    icon: Clock3
  }
];

function formatDeadline(value?: Date) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

export default function Page() {
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshEligibility() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/matches/refresh", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to run eligibility check.");
      }
      setMatches(data);
    } catch (err) {
      setError((err as Error).message || "Unable to run eligibility check.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshEligibility();
  }, []);

  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Eligibility checker</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Find the housing programs you qualify for.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Heloci runs your profile against programs and gives you clear next steps, recommendations, and application options.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button onClick={() => void refreshEligibility()} className="min-w-[170px]">
                {loading ? "Checking eligibility…" : "Run eligibility check"}
              </Button>
              <Button asChild variant="outline" className="min-w-[170px]">
                <Link href="/apply">Browse programs</Link>
              </Button>
              <Button asChild variant="ghost" className="min-w-[170px]">
                <Link href="/eligibility/assistant">Use assistant</Link>
              </Button>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-slate-500">
              If your profile is incomplete, Heloci will still return recommendations and let you apply to programs while showing what is missing.
            </p>
          </div>

          <div className="rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm">
            <div className="space-y-5">
              {criteria.map((item) => (
                <div key={item.title} className="rounded-[28px] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-brand">
                    <item.icon className="h-5 w-5" />
                    <p className="text-base font-semibold text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {loading ? (
          <Card className="rounded-[32px] p-8 text-slate-600">Running eligibility check…</Card>
        ) : error ? (
          <Card className="rounded-[32px] p-8 text-red-600">
            <p className="mb-4">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/check-eligibility">Update profile</Link>
              </Button>
              <Button asChild>
                <Link href="/apply">Browse programs</Link>
              </Button>
            </div>
          </Card>
        ) : !matches || (matches.eligible.length === 0 && matches.nearlyEligible.length === 0) ? (
          <Card className="rounded-[32px] p-8 text-slate-700">
            <p className="mb-4">No eligible programs were found yet. You can still apply using the programs page and update your profile to improve your match recommendations.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/check-eligibility">Update profile</Link>
              </Button>
              <Button asChild>
                <Link href="/apply">Browse programs</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
            <div className="space-y-6">
              {matches.eligible.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Eligible programs</p>
                      <h2 className="text-2xl font-semibold text-slate-950">Apply with confidence</h2>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Ready to apply</span>
                  </div>
                  <div className="grid gap-6">
                    {matches.eligible.map((program) => (
                      <ProgramCard key={program.programId} program={program} />
                    ))}
                  </div>
                </section>
              ) : null}

              {matches.nearlyEligible.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Nearly eligible</p>
                      <h2 className="text-2xl font-semibold text-slate-950">Close to qualifying</h2>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">Almost there</span>
                  </div>
                  <div className="grid gap-6">
                    {matches.nearlyEligible.map((program) => (
                      <ProgramCard key={program.programId} program={program} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {matches.recommendedActions.length > 0 ? (
              <Card className="rounded-[32px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Recommended actions</p>
                <div className="mt-6 space-y-4">
                  {matches.recommendedActions.map((action, index) => (
                    <div key={`${action.action}-${index}`} className="rounded-3xl border border-border bg-slate-50 p-4">
                      <p className="font-semibold text-slate-950">{action.action}</p>
                      <p className="mt-2 text-sm text-slate-600">Heloci recommends this for: {action.programs.join(", ")}</p>
                      <p className="mt-2 text-sm text-[#006AFF]">Missing: {action.missingFields.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ProgramCard({ program }: { program: ProgramMatch }) {
  return (
    <Card className="rounded-[20px] p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{program.programName}</h3>
          {program.matchDescription ? <p className="mt-2 text-sm text-slate-600">{program.matchDescription}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={program.isEligible ? "rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700" : "rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"}>
            Score: {program.score}/100
          </span>
          {program.deadline ? <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">Deadline {formatDeadline(program.deadline)}</span> : null}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        {program.matched.length > 0 ? (
          <div>
            <p className="font-semibold text-slate-800">Why you qualify</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {program.matched.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {program.failed.length > 0 ? (
          <div>
            <p className="font-semibold text-slate-800">What you still need</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {program.failed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="rounded-full bg-[#006AFF] text-white hover:bg-[#0057e6]">
          <Link href={program.applicationStatus === "submitted" ? "/dashboard" : `/apply/${program.programSlug}`}>
            {program.applicationStatus === "draft" ? "Continue application" : program.applicationStatus === "submitted" ? "View application" : "Start application"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
