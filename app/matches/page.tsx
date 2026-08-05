"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MatchResult, ProgramMatch } from "@/lib/matching/engine";

function formatDeadline(value?: Date) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMatches() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/matches");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load matches.");
      setMatches(data);
      
      // If no matches and no error, log helpful diagnostic
      if (data.eligible.length === 0 && data.nearlyEligible.length === 0) {
        console.log("ℹ️  No matches returned. This could be because:");
        console.log("   1. No active programs exist in the system");
        console.log("   2. No programs have active eligibility rules");
        console.log("   3. Your profile doesn't match any program criteria");
        console.log("   4. The organization ID doesn't match available programs");
        console.log("\n   Check the browser console and server logs for more details.");
      }
    } catch (err) {
      setError((err as Error).message || "Unable to load matches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMatches();
  }, []);

  async function refreshMatches() {
    try {
      const response = await fetch("/api/matches/refresh", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to refresh matches.");
      setMatches(data);
    } catch (err) {
      setError((err as Error).message || "Unable to refresh matches.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">Program matches</p>
            <h1 className="text-4xl font-semibold text-slate-950">Your best Heloci opportunities</h1>
            <p className="max-w-2xl text-sm text-slate-600">Matches are ranked from your profile, eligibility results, and pending actions.</p>
          </div>
          <Button onClick={() => void refreshMatches()} variant="outline">Refresh matches</Button>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Eligibility guidance</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Use the results as guidance, not a dead end.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">If a program needs extra review, Heloci will highlight that clearly and help you continue with the next step.</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
              You can continue to apply even when more documentation is needed.
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="rounded-[16px] p-8 text-slate-600">Loading your matches…</Card>
        ) : error ? (
          <Card className="rounded-[16px] p-8 text-red-600">{error}</Card>
        ) : !matches || (matches.eligible.length === 0 && matches.nearlyEligible.length === 0 && matches.recommendedActions.length === 0) ? (
          <Card className="rounded-[16px] p-8">
            <div className="space-y-4">
              <p className="mb-4 text-slate-700">No matches found yet.</p>
              <p className="text-sm text-slate-600">This could mean:</p>
              <ul className="list-disc space-y-2 pl-6 text-sm text-slate-600">
                <li>Your profile needs more information (add income, household size, or housing goals)</li>
                <li>No programs are currently available that match your situation</li>
                <li>Programs may be added soon—check back later</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/check-eligibility" className="inline-flex items-center gap-2 rounded-full bg-[#006AFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0057e6]">
                  Update your profile
                </Link>
                <Link href="/apply" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Browse all programs
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-950">Your matches</h2>
                <Badge className="bg-emerald-100 text-emerald-700">Eligible</Badge>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {matches.eligible.map((program) => (
                  <MatchCard key={program.programId} program={program} />
                ))}
              </div>
            </section>

            {matches.nearlyEligible.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-950">Nearly eligible</h2>
                  <Badge className="bg-amber-100 text-amber-700">Almost there</Badge>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {matches.nearlyEligible.map((program) => (
                    <MatchCard key={program.programId} program={program} />
                  ))}
                </div>
              </section>
            ) : null}

            {matches.recommendedActions.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-950">Recommended actions</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {matches.recommendedActions.map((action, index) => (
                    <Card key={`${action.action}-${index}`} className="rounded-[16px] p-6">
                      <p className="text-lg font-semibold text-slate-950">{action.action}</p>
                      <p className="mt-2 text-sm text-slate-600">This unlocks: {action.programs.join(", ")}</p>
                      {action.missingFields.length > 0 ? <p className="mt-3 text-sm font-semibold text-[#006AFF]">Missing fields: {action.missingFields.join(", ")}</p> : null}
                      <Link href="/check-eligibility?section=employment" className="mt-4 inline-flex text-sm font-semibold text-[#006AFF]">Update profile</Link>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ program }: { program: ProgramMatch }) {
  return (
    <Card className="rounded-[16px] p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{program.programName}</h3>
          {program.matchDescription ? <p className="mt-2 text-sm text-slate-600">{program.matchDescription}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={program.isEligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>Score: {program.score}/100</Badge>
          {program.needsReview ? <Badge className="bg-slate-100 text-slate-700">Manual review</Badge> : null}
          {program.deadline ? <Badge className="bg-rose-100 text-rose-700">Deadline {formatDeadline(program.deadline)}</Badge> : null}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        <div>
          <p className="font-semibold text-slate-800">Why you qualify</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {program.matched.length > 0 ? program.matched.map((item) => <li key={item}>{item}</li>) : <li>No matched criteria returned.</li>}
          </ul>
        </div>
        {program.failed.length > 0 ? <div>
          <p className="font-semibold text-slate-800">What you still need</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {program.failed.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="rounded-full bg-[#006AFF] text-white hover:bg-[#0057e6]">
          <Link href={program.applicationStatus === "draft" ? `/apply/${program.programSlug}` : program.applicationStatus === "submitted" ? "/dashboard" : `/apply/${program.programSlug}`}>
            {program.applicationStatus === "draft" ? "Continue application" : program.applicationStatus === "submitted" ? "View application" : "Start application"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
