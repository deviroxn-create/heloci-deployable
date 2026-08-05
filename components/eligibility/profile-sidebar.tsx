"use client";

import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  HelpCircle,
  Save,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps {
  completionScore: number;
  answeredCount: number;
  totalCount: number;
  draftSavedAt?: string | null;
  estimatedMinutesLeft: number;
  onSaveAndExit: () => void;
  isSaving: boolean;
}

const SECTIONS = [
  { key: "personal", label: "Personal info" },
  { key: "household", label: "Household" },
  { key: "income", label: "Income" },
  { key: "employment", label: "Employment" },
  { key: "housing", label: "Housing situation" },
  { key: "preferences", label: "Preferences" }
];

const HELP_LINKS = [
  {
    icon: HelpCircle,
    label: "What is eligibility?",
    href: "/about#eligibility"
  },
  {
    icon: FileText,
    label: "What documents do I need?",
    href: "/apply"
  },
  {
    icon: BookOpen,
    label: "Browse all programs",
    href: "/matches"
  },
  {
    icon: ShieldCheck,
    label: "Privacy & data use",
    href: "/about"
  }
];

export function ProfileSidebar({
  completionScore,
  answeredCount,
  totalCount,
  draftSavedAt,
  estimatedMinutesLeft,
  onSaveAndExit,
  isSaving
}: ProfileSidebarProps) {
  const sectionsDone = Math.round((completionScore / 100) * SECTIONS.length);

  return (
    <aside className="space-y-4">
      {/* Profile completion card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Profile completion
        </p>

        <div className="mt-3 flex items-end justify-between">
          <span className="text-3xl font-bold text-slate-900">{completionScore}%</span>
          <span className="mb-1 text-xs text-slate-500">
            {answeredCount} / {totalCount} answered
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#006AFF] to-[#338bff] transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {SECTIONS.map((section, index) => {
            const done = index < sectionsDone;
            return (
              <li key={section.key} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    done ? "text-slate-700" : "text-slate-400"
                  )}
                >
                  {section.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Time & draft status */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-[#006AFF]" />
          <span>
            About{" "}
            <span className="font-semibold text-slate-900">
              {estimatedMinutesLeft} min
            </span>{" "}
            remaining
          </span>
        </div>

        {draftSavedAt ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Draft saved {draftSavedAt}</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Save className="h-3.5 w-3.5" />
            <span>Auto-saves as you go</span>
          </div>
        )}

        <button
          type="button"
          onClick={onSaveAndExit}
          disabled={isSaving}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30"
        >
          {isSaving ? "Saving…" : "Save & exit"}
        </button>
      </div>

      {/* Help links */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Resources
        </p>
        <ul className="mt-3 space-y-2">
          {HELP_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#006AFF]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
