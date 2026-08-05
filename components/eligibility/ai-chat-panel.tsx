"use client";

import { Bot, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AIChatPanelProps {
  questionLabel: string;
  helpText?: string;
  questionIndex: number;
  totalQuestions: number;
}

const AI_EXPLANATIONS: Record<string, string> = {
  default:
    "This helps me understand your situation better so I can match you with the programs that fit best.",
  income:
    "Income is the most important factor for most housing programs. Knowing your range helps me instantly filter dozens of programs that wouldn't apply to you.",
  household:
    "Many programs are sized around family or household composition. This unlocks programs designed specifically for your household structure.",
  employment:
    "Your employment status affects which programs you qualify for — some are for working adults, others support people between jobs.",
  housing:
    "Understanding where you live now helps me suggest programs in your area and flag any urgency-based priority support.",
  veteran:
    "Veterans qualify for a separate category of housing assistance that I'd love to check for you.",
  disability:
    "People with disabilities often qualify for accessible housing programs with different income thresholds.",
  education:
    "Some programs target recent graduates or continuing students — this unlocks those matches.",
  location:
    "Location determines which programs are available to you. I'll only show what's actually reachable from where you want to be.",
  goal:
    "Your housing goal shapes everything — whether that's renting, buying, or getting emergency support, each has a completely different set of programs."
};

function getExplanation(label: string, helpText?: string): string {
  const text = `${label} ${helpText ?? ""}`.toLowerCase();
  if (/income|salary|earn|wage/i.test(text)) return AI_EXPLANATIONS.income;
  if (/household|family|member|size/i.test(text)) return AI_EXPLANATIONS.household;
  if (/employ|job|work|occupation/i.test(text)) return AI_EXPLANATIONS.employment;
  if (/housing|home|live|address/i.test(text)) return AI_EXPLANATIONS.housing;
  if (/veteran|military|service/i.test(text)) return AI_EXPLANATIONS.veteran;
  if (/disab|medical/i.test(text)) return AI_EXPLANATIONS.disability;
  if (/education|school|degree/i.test(text)) return AI_EXPLANATIONS.education;
  if (/location|city|state|area|where/i.test(text)) return AI_EXPLANATIONS.location;
  if (/goal|purpose|looking for|need/i.test(text)) return AI_EXPLANATIONS.goal;
  return AI_EXPLANATIONS.default;
}

export function AIChatPanel({ questionLabel, helpText, questionIndex, totalQuestions }: AIChatPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const explanation = getExplanation(questionLabel, helpText);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#006AFF]/20 bg-gradient-to-br from-[#f0f7ff] to-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006AFF]/10">
            <Sparkles className="h-3.5 w-3.5 text-[#006AFF]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#006AFF]">
            Heloci AI
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={collapsed ? "Expand AI panel" : "Collapse AI panel"}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-96 opacity-100"
        )}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* AI bubble */}
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006AFF] text-white">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white px-4 py-3 text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed">
              {explanation}
            </div>
          </div>

          {/* Progress context bubble */}
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white px-4 py-3 text-sm text-slate-600 shadow-sm border border-slate-100 leading-relaxed">
              Question{" "}
              <span className="font-semibold text-slate-900">{questionIndex + 1}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalQuestions}</span>. You're doing great — most people finish in under 4 minutes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
