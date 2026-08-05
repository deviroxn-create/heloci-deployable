"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  Sparkles,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface ProgramMatch {
  programId: string;
  programName: string;
  programSlug: string;
  programCategory: string;
  organizationName?: string;
  housingGoal?: string;
  summary?: string;
  deadline?: Date;
  score: number;
  isEligible: boolean;
  matched: string[];
  failed: string[];
  scoreBreakdown: Array<{ rule: string; points: number }>;
  matchDescription?: string;
  applicationStatus?: "not_started" | "draft" | "submitted";
}

interface MatchesResponse {
  eligible: ProgramMatch[];
  nearlyEligible: ProgramMatch[];
  recommendedActions: Array<{
    action: string;
    programs: string[];
    missingFields: string[];
  }>;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getMatchTier(score: number): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  if (score >= 85)
    return { label: "Excellent Match", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 };
  if (score >= 70)
    return { label: "Good Match", color: "text-blue-700 bg-blue-50 border-blue-200", icon: CheckCircle2 };
  if (score >= 50)
    return { label: "Possible Match", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Sparkles };
  return { label: "Low Match", color: "text-slate-600 bg-slate-50 border-slate-200", icon: AlertCircle };
}

function generateExplanation(match: ProgramMatch) {
  const strengths: string[] = [];
  const missing: string[] = [];

  // Extract strengths from matched criteria
  match.matched.forEach((criterion) => {
    if (/income/i.test(criterion)) strengths.push("Your income fits program requirements");
    else if (/household/i.test(criterion)) strengths.push("Household size qualifies");
    else if (/housing.*goal/i.test(criterion)) strengths.push("Housing goal matches program type");
    else if (/location|state|city/i.test(criterion)) strengths.push("Program available in your preferred area");
    else if (/veteran/i.test(criterion)) strengths.push("Veteran status qualifies");
    else if (/teacher/i.test(criterion)) strengths.push("Teacher qualification verified");
    else strengths.push(criterion);
  });

  // Extract missing requirements from failed criteria
  match.failed.forEach((criterion) => {
    if (/income/i.test(criterion)) missing.push("Provide income verification documents");
    else if (/employment/i.test(criterion)) missing.push("Complete employment history section");
    else if (/veteran/i.test(criterion)) missing.push("Upload veteran verification");
    else if (/document/i.test(criterion)) missing.push("Submit required documentation");
    else missing.push(criterion);
  });

  // Add generic strengths if none found
  if (strengths.length === 0) {
    if (match.score >= 50) {
      strengths.push("Basic profile information matches");
      strengths.push("Program accepts applications in your category");
    } else {
      strengths.push("You can always submit an application");
    }
  }

  // Add generic improvements if score is low
  if (match.score < 70 && missing.length === 0) {
    missing.push("Complete your profile for a personalized match score");
  }

  return { strengths, missing };
}

/* ─── Match Card ─────────────────────────────────────────────── */
function MatchCard({ match }: { match: ProgramMatch }) {
  const tier = getMatchTier(match.score);
  const TierIcon = tier.icon;
  const explanation = generateExplanation(match);

  return (
    <article className="rounded-[32px] border border-border bg-white p-8 shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#006AFF]">
              {match.programCategory}
            </p>
          </div>
          <h2 className="mt-1.5 text-xl font-bold text-slate-950">{match.programName}</h2>
          {match.matchDescription && (
            <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">{match.matchDescription}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{match.score}%</p>
            <p className="text-xs text-slate-500">Match score</p>
          </div>
        </div>
      </div>

      {/* Match tier badge */}
      <div className="mt-4 flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", tier.color)}>
          <TierIcon className="h-3.5 w-3.5" />
          {tier.label}
        </span>
        {match.applicationStatus === "draft" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Draft in progress
          </span>
        )}
        {match.applicationStatus === "submitted" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Application submitted
          </span>
        )}
      </div>

      {/* Match explanation */}
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Why we recommend this:</p>
          <ul className="mt-2 space-y-1.5">
            {explanation.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {explanation.missing.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-900">To strengthen your application:</p>
            <ul className="mt-2 space-y-1.5">
              {explanation.missing.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-amber-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {match.applicationStatus === "draft" ? (
          <Button asChild>
            <Link href={`/apply/${match.programSlug}`} className="inline-flex items-center gap-2">
              Continue application <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : match.applicationStatus === "submitted" ? (
          <Button asChild variant="outline">
            <Link href="/applicant/applications">View application</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/apply/${match.programSlug}`} className="inline-flex items-center gap-2">
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/programs/${match.programSlug}`}>View details</Link>
        </Button>
        <button
          type="button"
          aria-label="Save for later"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      {match.deadline && new Date(match.deadline) > new Date() && (
        <p className="mt-4 text-xs text-amber-700">
          ⚠ Deadline: {new Date(match.deadline).toLocaleDateString()}
        </p>
      )}
    </article>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MatchResultsPage() {
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/matches")
      .then((r) => r.json())
      .then((d: MatchesResponse & { error?: string }) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setData(d);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hasMatches = data && (data.eligible.length > 0 || data.nearlyEligible.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">Your program matches</h1>
              <p className="mt-2 text-base text-slate-600">
                Based on your profile, we've identified programs that may fit your situation.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/check-eligibility">
                <Sparkles className="mr-2 h-4 w-4" />
                Update profile
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="space-y-3 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#006AFF]" />
              <p className="text-sm text-slate-600">Finding your best matches…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/check-eligibility">Check eligibility</Link>
            </Button>
          </div>
        )}

        {!loading && !error && !hasMatches && (
          <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Home className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No matches found yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              This could mean your profile needs more information, or no programs currently match your situation.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Try completing your income range, household size, and housing goals. You can also browse all available programs.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/check-eligibility">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Complete profile
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/apply">
                  Browse all programs
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && hasMatches && (
          <div className="space-y-12">
            {/* Excellent matches */}
            {data.eligible.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-950">Best matches</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    These programs are excellent fits based on your profile.
                  </p>
                </div>
                <div className="grid gap-6">
                  {data.eligible.map((match) => (
                    <MatchCard key={match.programId} match={match} />
                  ))}
                </div>
              </section>
            )}

            {/* Good matches */}
            {data.nearlyEligible.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-950">Good matches</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    You're close to qualifying for these programs — small updates to your profile could improve your match.
                  </p>
                </div>
                <div className="grid gap-6">
                  {data.nearlyEligible.map((match) => (
                    <MatchCard key={match.programId} match={match} />
                  ))}
                </div>
              </section>
            )}

            {/* Recommended actions */}
            {data.recommendedActions.length > 0 && (
              <section className="rounded-[32px] bg-gradient-to-br from-[#f0f7ff] to-white p-8 border border-[#006AFF]/10">
                <div className="flex items-start gap-4">
                  <Sparkles className="mt-1 h-6 w-6 shrink-0 text-[#006AFF]" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-950">Unlock more matches</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Complete these actions to improve your match scores and unlock additional programs:
                    </p>
                    <ul className="mt-4 space-y-3">
                      {data.recommendedActions.map((action, idx) => (
                        <li key={idx} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="font-semibold text-slate-900">{action.action}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            Affects: {action.programs.slice(0, 2).join(", ")}
                            {action.programs.length > 2 && ` +${action.programs.length - 2} more`}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6">
                      <Link href="/check-eligibility">
                        Update profile <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Info panel */}
        {!loading && hasMatches && (
          <section className="mt-12 rounded-[32px] bg-[#f0f7ff] p-8">
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-6 w-6 shrink-0 text-[#006AFF]" />
              <div>
                <p className="font-semibold text-slate-900">About match scores</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Match scores help you focus on programs where you have the best chance, but you can apply to any
                  program regardless of score. Final eligibility is determined by the housing provider after reviewing
                  your full application.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
