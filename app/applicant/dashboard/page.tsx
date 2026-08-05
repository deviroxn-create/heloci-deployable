"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  status: string;
  updatedAt: string;
  program: {
    name: string;
    slug: string;
  };
  documentRequests: Array<{ status: string }>;
}

interface ProgramMatch {
  programId: string;
  programName: string;
  programSlug: string;
  score: number;
  matchDescription?: string;
}

interface DashboardData {
  applications: Application[];
  recommendedPrograms: ProgramMatch[];
  pendingDocuments: number;
  profileCompletion: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-700", icon: Clock },
  under_review: { label: "Under review", color: "bg-amber-50 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700", icon: AlertTriangle },
  waitlisted: { label: "Waitlisted", color: "bg-purple-50 text-purple-700", icon: Clock },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetch("/api/applications/my").then(r => r.json()),
      fetch("/api/matches").then(r => r.json()),
      fetch("/api/applicant-profile").then(r => r.json()),
    ]).then(([apps, matches, profile]) => {
      const applications = apps.applications ?? [];
      const recommended = [...(matches.eligible ?? []), ...(matches.nearlyEligible ?? [])].slice(0, 3);
      const pendingDocs = applications.reduce(
        (sum: number, app: Application) => 
          sum + app.documentRequests.filter(d => d.status === "pending").length,
        0
      );
      const profileData = profile.profile ?? {};
      const totalFields = 10;
      const filledFields = [
        profileData.personal?.fullName,
        profileData.personal?.dateOfBirth,
        profileData.household?.householdSize,
        profileData.income?.incomeRange,
        profileData.employment?.status,
        profileData.housing?.currentHousingSituation,
      ].filter(Boolean).length;
      const completion = Math.round((filledFields / totalFields) * 100);

      setData({
        applications,
        recommendedPrograms: recommended,
        pendingDocuments: pendingDocs,
        profileCompletion: completion,
      });
    }).finally(() => setLoading(false));
  }, []);

  const recentApps = data?.applications.slice(0, 3) ?? [];
  const drafts = recentApps.filter(a => a.status === "draft");
  const hasOutstandingTasks = (data?.pendingDocuments ?? 0) > 0 || drafts.length > 0 || (data?.profileCompletion ?? 0) < 80;

  return (
    <ApplicantShell
      title="Dashboard"
      description="Your housing application hub — track applications, upload documents, and discover new programs."
    >
      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#006AFF]" />
          <span className="text-sm text-slate-600">Loading your dashboard…</span>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          {/* Outstanding tasks */}
          {hasOutstandingTasks && (
            <section className="rounded-[32px] border-2 border-amber-200 bg-amber-50 p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-amber-900">Outstanding tasks</h2>
                  <ul className="mt-4 space-y-3">
                    {data.profileCompletion < 80 && (
                      <li className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                        <div>
                          <p className="font-semibold text-slate-900">Complete your profile</p>
                          <p className="text-sm text-slate-600">Your profile is {data.profileCompletion}% complete</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href="/check-eligibility">Complete</Link>
                        </Button>
                      </li>
                    )}
                    {drafts.map((app) => (
                      <li key={app.id} className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                        <div>
                          <p className="font-semibold text-slate-900">Continue draft application</p>
                          <p className="text-sm text-slate-600">{app.program.name}</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/apply/${app.program.slug}`}>Continue</Link>
                        </Button>
                      </li>
                    ))}
                    {data.pendingDocuments > 0 && (
                      <li className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                        <div>
                          <p className="font-semibold text-slate-900">Upload pending documents</p>
                          <p className="text-sm text-slate-600">{data.pendingDocuments} document{data.pendingDocuments === 1 ? '' : 's'} requested</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href="/applicant/documents">Upload</Link>
                        </Button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section className="rounded-[32px] border border-brand/15 bg-gradient-to-r from-[#f5faff] to-white p-8 shadow-soft">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-600">Common tasks to keep your applications moving forward.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { 
                  title: "Browse matches", 
                  description: "View programs recommended for you", 
                  href: "/matches",
                  icon: Sparkles
                },
                { 
                  title: "Start new application", 
                  description: "Apply to another housing program", 
                  href: "/apply",
                  icon: PlusCircle
                },
                { 
                  title: "View documents", 
                  description: "Upload or check document status", 
                  href: "/applicant/documents",
                  icon: FileText
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.title} 
                    href={item.href} 
                    className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-brand">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{item.title}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.description}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand group-hover:gap-3 transition-all">
                      Open <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Applications */}
            <section className="rounded-[32px] bg-white p-8 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Your applications</h2>
                  <p className="mt-1 text-sm text-slate-600">Track the status of your housing applications</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/applicant/applications">View all</Link>
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                {recentApps.length > 0 ? recentApps.map((app) => {
                  const config = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;
                  const Icon = config.icon;
                  const hasPendingDocs = app.documentRequests.some(d => d.status === "pending");
                  
                  return (
                    <div key={app.id} className="rounded-[24px] border border-border bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-950">{app.program.name}</p>
                          <p className="mt-1 text-sm text-slate-600">Updated {timeAgo(app.updatedAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", config.color)}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                          {hasPendingDocs && (
                            <span className="text-xs text-amber-700">Docs pending</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {app.status === "draft" ? (
                          <Button asChild size="sm">
                            <Link href={`/apply/${app.program.slug}`}>Continue</Link>
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline">
                            <Link href="/applicant/applications">View details</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">No applications yet</p>
                    <p className="mt-1 text-sm text-slate-600">Start by browsing your recommended programs</p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/matches/results">View matches</Link>
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recommended programs */}
              <section className="rounded-[32px] bg-white p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#006AFF]" />
                  <h3 className="font-semibold text-slate-950">Recommended for you</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {data.recommendedPrograms.length > 0 ? data.recommendedPrograms.map((program) => (
                    <div key={program.programId} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{program.programName}</p>
                        <span className="shrink-0 text-xs font-bold text-[#006AFF]">{program.score}%</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                        {program.matchDescription ?? "Your profile matches this program"}
                      </p>
                      <Link href={`/apply/${program.programSlug}`} className="mt-2 inline-block text-xs font-semibold text-[#006AFF] hover:text-[#0057e6]">
                        Apply now →
                      </Link>
                    </div>
                  )) : (
                    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-600">Complete your profile to see recommendations</p>
                      <Link href="/check-eligibility" className="mt-2 inline-block text-sm font-semibold text-[#006AFF] hover:text-[#0057e6]">
                        Update profile
                      </Link>
                    </div>
                  )}
                </div>
                {data.recommendedPrograms.length > 0 && (
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link href="/matches/results">View all matches</Link>
                  </Button>
                )}
              </section>

              {/* Help */}
              <section className="rounded-[32px] bg-gradient-to-br from-[#f0f7ff] to-white p-6 border border-[#006AFF]/10">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#006AFF]" />
                  <h3 className="font-semibold text-slate-950">Need help?</h3>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Our Housing Case Worker is here to answer questions about your applications, eligibility, or next steps.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link href="/check-eligibility">Chat with assistant</Link>
                </Button>
              </section>
            </div>
          </div>
        </div>
      )}
    </ApplicantShell>
  );
}
