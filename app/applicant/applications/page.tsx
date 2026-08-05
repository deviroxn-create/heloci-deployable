"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface DocumentRequest {
  id: string;
  documentType: string;
  status: string;
}

interface ApplicationItem {
  id: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    housingGoal: string;
    organization: { name: string } | null;
  };
  documentRequests: DocumentRequest[];
}

/* ─── Status helpers ─────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:        { label: "Draft",        className: "bg-slate-100 text-slate-700",      icon: FileText },
  submitted:    { label: "Submitted",    className: "bg-blue-50 text-blue-700",         icon: Clock },
  under_review: { label: "Under review", className: "bg-amber-50 text-amber-700",       icon: Clock },
  approved:     { label: "Approved",     className: "bg-emerald-50 text-emerald-700",   icon: CheckCircle2 },
  rejected:     { label: "Rejected",     className: "bg-red-50 text-red-700",           icon: XCircle },
  waitlisted:   { label: "Waitlisted",   className: "bg-purple-50 text-purple-700",     icon: Clock },
};

function statusFor(status: string) {
  return STATUS_CONFIG[status.toLowerCase()] ?? STATUS_CONFIG.draft;
}

function progressFor(status: string): number {
  const map: Record<string, number> = {
    draft: 15, submitted: 40, under_review: 65, approved: 100, rejected: 100, waitlisted: 50,
  };
  return map[status.toLowerCase()] ?? 20;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/applications/my")
      .then((r) => r.json())
      .then((d: { applications?: ApplicationItem[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setApplications(d.applications ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ApplicantShell
      title="My applications"
      description="Track the status of every application, upload missing documents, and pick up where you left off."
    >
      <div className="space-y-6">
        {/* Header action */}
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/apply" className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Start new application
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#006AFF]" />
            <span className="text-sm text-slate-600">Loading your applications…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No applications yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Find a housing program and start your first application.
            </p>
            <Button asChild className="mt-6">
              <Link href="/apply">Browse programs</Link>
            </Button>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-2">
            {applications.map((app) => {
              const s = statusFor(app.status);
              const StatusIcon = s.icon;
              const progress = progressFor(app.status);
              const pendingDocs = app.documentRequests.filter((d) => d.status === "pending").length;
              const isDraft = app.status === "draft";

              return (
                <article
                  key={app.id}
                  className="rounded-[32px] border border-border bg-white p-8 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-[#006AFF]">
                        {app.program.organization?.name ?? app.program.category ?? app.program.housingGoal}
                      </p>
                      <h2 className="mt-1.5 text-xl font-bold text-slate-950">
                        {app.program.name}
                      </h2>
                    </div>
                    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", s.className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {s.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Updated {timeAgo(app.updatedAt)}
                    {app.submittedAt && ` · Submitted ${timeAgo(app.submittedAt)}`}
                  </p>

                  {pendingDocs > 0 && (
                    <p className="mt-3 text-sm font-medium text-amber-700">
                      ⚠ {pendingDocs} document{pendingDocs > 1 ? "s" : ""} still needed
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Application progress</span>
                      <span className="font-semibold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          app.status === "approved" ? "bg-emerald-500" :
                          app.status === "rejected" ? "bg-red-400" :
                          "bg-[#006AFF]"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {isDraft && (
                      <Button asChild>
                        <Link href={`/apply/${app.program.slug}`} className="inline-flex items-center gap-2">
                          Continue <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    {pendingDocs > 0 && (
                      <Button asChild variant="outline">
                        <Link href="/applicant/documents">Upload documents</Link>
                      </Button>
                    )}
                    {!isDraft && (
                      <Button asChild variant="outline">
                        <Link href="/applicant/documents">View documents</Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </ApplicantShell>
  );
}
