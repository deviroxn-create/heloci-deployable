"use client";

import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileSnapshot {
  householdSize?: number;
  incomeRange?: string;
  preferredLocations?: string[];
  housingGoals?: string[];
  isVeteran?: boolean;
  isDisabilityAffected?: boolean;
  isPublicWorker?: boolean;
}

interface MatchItem {
  programId: string;
  programName: string;
  programSlug: string;
  score?: number;
  isEligible: boolean;
}

interface CompletionSummaryProps {
  answers: Record<string, unknown>;
  initialMatches?: MatchItem[];
  isGuest?: boolean;
  onViewMatches: () => void;
  onSaveAndExit: () => void;
}

function formatIncomeRange(value: string | undefined): string {
  if (!value) return "Not provided";
  const MAP: Record<string, string> = {
    under_1000:         "Under $1,000/mo",
    "1000_3000":        "$1,000–$3,000/mo",
    "3000_5000":        "$3,000–$5,000/mo",
    "5000_8000":        "$5,000–$8,000/mo",
    "8000_15000":       "$8,000–$15,000/mo",
    "15000_plus":       "$15,000+/mo",
    prefer_not_to_say:  "Prefer not to say",
  };
  return MAP[value] ?? value;
}

function buildSnapshot(answers: Record<string, unknown>): ProfileSnapshot {
  const goals = answers["intention.housingGoals"];
  const goalList: string[] = Array.isArray(goals)
    ? goals.map(String)
    : typeof goals === "string" && goals
    ? goals.split(",").map((s) => s.trim())
    : [];

  const locations = answers["preferences.states"];
  const locationList: string[] = Array.isArray(locations)
    ? locations.map(String)
    : [];

  return {
    householdSize:
      typeof answers["household.size"] === "number"
        ? answers["household.size"]
        : typeof answers["household.size"] === "string"
        ? Number(answers["household.size"]) || undefined
        : undefined,
    incomeRange: answers["income.range"] as string | undefined,
    preferredLocations: locationList,
    housingGoals: goalList,
    isVeteran: answers["personal.isVeteran"] === "true" || answers["personal.isVeteran"] === true,
    isDisabilityAffected:
      answers["personal.isDisabilityAffected"] === "true" ||
      answers["personal.isDisabilityAffected"] === true,
    isPublicWorker:
      answers["personal.isPublicWorker"] === "true" ||
      answers["personal.isPublicWorker"] === true,
  };
}

const GOAL_LABELS: Record<string, string> = {
  affordable_housing:        "Affordable Housing",
  public_housing:            "Public Housing",
  section_8:                 "Section 8 Voucher",
  emergency_housing:         "Emergency Housing",
  rent_assistance:           "Rent Assistance",
  rent_to_own:               "Rent to Own",
  first_time_homebuyer:      "First-Time Homebuyer",
  down_payment_assistance:   "Down Payment Assistance",
  veteran_housing:           "Veteran Housing",
  senior_housing:            "Senior Housing",
  accessible_housing:        "Accessible Housing",
  healthcare_worker_housing: "Healthcare Worker Housing",
  teacher_housing:           "Teacher Housing",
  family_housing:            "Family Housing",
  domestic_violence:         "Domestic Violence Assistance",
  disaster_recovery:         "Disaster Recovery Housing",
  student_housing:           "Student Housing",
  other:                     "Other",
};

export function CompletionSummary({
  answers,
  initialMatches,
  isGuest = false,
  onViewMatches,
  onSaveAndExit,
}: CompletionSummaryProps) {
  const [matches, setMatches] = useState<MatchItem[]>(initialMatches ?? []);
  const [loadingMatches, setLoadingMatches] = useState(!initialMatches);
  const snapshot = buildSnapshot(answers);

  useEffect(() => {
    if (initialMatches) return;
    void fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data?.eligible)
          ? (data.eligible as MatchItem[]).slice(0, 6)
          : [];
        setMatches(items);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false));
  }, [initialMatches]);

  const goalLabels =
    snapshot.housingGoals
      ?.map((g) => GOAL_LABELS[g] ?? g)
      .filter(Boolean)
      .slice(0, 4) ?? [];

  const hasSpecialStatus =
    snapshot.isVeteran || snapshot.isDisabilityAffected || snapshot.isPublicWorker;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">
          You're all set!
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Based on what you've shared, I've identified housing programs that may fit
          your situation. Here's a summary of your profile.
        </p>
      </div>

      {/* Profile summary card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Your Profile Summary
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Household */}
          {snapshot.householdSize !== undefined && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#006AFF]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Household</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {snapshot.householdSize}{" "}
                  {snapshot.householdSize === 1 ? "person" : "people"}
                </p>
              </div>
            </div>
          )}

          {/* Income */}
          {snapshot.incomeRange && snapshot.incomeRange !== "prefer_not_to_say" && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-[#006AFF]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Income Range</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatIncomeRange(snapshot.incomeRange)}
                </p>
              </div>
            </div>
          )}

          {/* Locations */}
          {snapshot.preferredLocations && snapshot.preferredLocations.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#006AFF]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Locations</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {snapshot.preferredLocations.slice(0, 5).map((loc) => (
                    <span
                      key={loc}
                      className="rounded-full bg-[#006AFF]/10 px-2.5 py-0.5 text-xs font-medium text-[#006AFF]"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Goals */}
          {goalLabels.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#006AFF]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Housing Goals</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {goalLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Special status */}
          {hasSpecialStatus && (
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {snapshot.isVeteran && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  🎖️ Veteran
                </span>
              )}
              {snapshot.isDisabilityAffected && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  ♿ Disability-related housing need
                </span>
              )}
              {snapshot.isPublicWorker && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  🏫 Public servant
                </span>
              )}
            </div>
          )}
        </div>

        {/* Missing info nudge */}
        {(!snapshot.incomeRange || !snapshot.householdSize) && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Incomplete profile</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Adding your income range and household size will significantly improve your matches.
                You can update your profile at any time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Program matches */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Programs Identified
        </p>

        {loadingMatches ? (
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#006AFF]" />
            <span className="text-sm">Loading your program matches…</span>
          </div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-slate-500">
            No matches yet. Complete more questions to improve your recommendations.
          </p>
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={m.programId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="truncate text-sm font-medium text-slate-800">
                    {m.programName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {m.score}% match
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Advisory disclaimer */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
        <p className="font-semibold text-slate-800">A note on recommendations</p>
        <p className="mt-1">
          Based on the information you've shared, I've identified several housing programs that
          may fit your situation. You are welcome to apply to <strong>any</strong> program.
          Final eligibility is determined by the housing provider after reviewing your
          application — these recommendations are advisory.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSaveAndExit}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30"
        >
          <Bookmark className="h-4 w-4" />
          {isGuest ? "Create an account to save" : "Save to profile"}
        </button>
        <button
          type="button"
          onClick={onViewMatches}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#006AFF] px-8 text-base font-semibold text-white shadow-md shadow-[#006AFF]/25 transition hover:bg-[#0057e6] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#006AFF]/30"
        >
          {isGuest ? "Create an account to apply" : "View all matches"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
