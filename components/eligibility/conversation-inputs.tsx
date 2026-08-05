"use client";

/**
 * conversation-inputs.tsx
 *
 * Renders the correct input widget for each ConversationStep.inputType.
 * Reuses the low-level primitives from question-inputs.tsx.
 * Adds the recommendation-preview and info panel types.
 */

import { ArrowRight, CheckCircle2, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BooleanCards,
  IncomeRangeSelector,
  MultiSelectCards,
  NumericStepper,
  RadioCards,
  SearchableChips,
  TextInput,
  DateInput,
} from "./question-inputs";
import type { ConversationStep } from "./conversation-config";

/* ──────────────────────────────────────────────────────────────
   Recommendation Preview Panel
────────────────────────────────────────────────────────────── */

interface ProgramMatchSummary {
  total: number;
  strongMatches: string[];
  nearMatches: string[];
}

function useLiveMatches(): {
  data: ProgramMatchSummary | null;
  loading: boolean;
} {
  const [data, setData] = useState<ProgramMatchSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void fetch("/api/matches")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const eligible: Array<{ programName: string; score: number }> =
          Array.isArray(json?.eligible) ? json.eligible : [];
        const near: Array<{ programName: string; score: number }> =
          Array.isArray(json?.nearlyEligible) ? json.nearlyEligible : [];

        setData({
          total: eligible.length + near.length,
          strongMatches: eligible.slice(0, 4).map((m) => m.programName),
          nearMatches: near.slice(0, 3).map((m) => m.programName),
        });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

function RecommendationPreviewPanel() {
  const { data, loading } = useLiveMatches();

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-[#006AFF]" />
        <span className="text-sm">Loading your matches…</span>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-slate-400" />
          <p className="text-sm text-slate-500">
            Keep answering questions to unlock your program matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Match count badge */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#006AFF]/20 bg-gradient-to-r from-[#f0f7ff] to-white p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10">
          <Sparkles className="h-6 w-6 text-[#006AFF]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{data.total}</p>
          <p className="text-sm text-slate-500">Programs identified so far</p>
        </div>
      </div>

      {/* Strong matches */}
      {data.strongMatches.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Strong Matches
          </p>
          <ul className="space-y-2">
            {data.strongMatches.map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Near matches */}
      {data.nearMatches.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
            Near Matches
          </p>
          <ul className="space-y-2">
            {data.nearMatches.map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm text-slate-700">
                <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Matches improve as you complete more of the profile.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Info step (stage transition card)
────────────────────────────────────────────────────────────── */

interface InfoPanelProps {
  subtext?: string;
}

function InfoPanel({ subtext }: InfoPanelProps) {
  if (!subtext) return null;
  // Split on \n\n for paragraph breaks
  const paragraphs = subtext.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-base leading-8 text-slate-600">
          {para}
        </p>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Master dispatcher
────────────────────────────────────────────────────────────── */

export interface ConversationInputProps {
  step: ConversationStep;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function ConversationInput({ step, value, onChange }: ConversationInputProps) {
  const { inputType, options = [], stepperMin = 0, stepperMax = 99, stepperSuffix, searchPlaceholder, subtext } = step;

  switch (inputType) {
    case "info":
      return <InfoPanel subtext={subtext} />;

    case "recommendation_preview":
      return <RecommendationPreviewPanel />;

    case "multiselect_cards":
      return (
        <MultiSelectCards
          options={options}
          value={value}
          onChange={(v) => onChange(v)}
        />
      );

    case "radio_cards":
      return (
        <RadioCards
          options={options}
          value={value}
          onChange={(v) => onChange(v)}
        />
      );

    case "boolean_cards":
      return (
        <BooleanCards
          value={value}
          onChange={(v) => onChange(v)}
        />
      );

    case "numeric_stepper":
      return (
        <NumericStepper
          value={value}
          onChange={(v) => onChange(v)}
          min={stepperMin}
          max={stepperMax}
          suffix={stepperSuffix}
        />
      );

    case "income_range":
      return (
        <IncomeRangeSelector
          value={value}
          onChange={(v) => onChange(v)}
        />
      );

    case "searchable_chips":
      return (
        <SearchableChips
          value={value}
          onChange={(v) => onChange(v)}
          placeholder={searchPlaceholder}
        />
      );

    case "date":
      return (
        <DateInput
          value={value}
          onChange={(v) => onChange(v)}
        />
      );

    case "text":
    default:
      return (
        <TextInput
          value={value}
          onChange={(v) => onChange(v)}
          placeholder={subtext}
        />
      );
  }
}
