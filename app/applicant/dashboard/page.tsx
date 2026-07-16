"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { StatusCard } from "@/components/applicant/status-card";
import { TaskCards } from "@/components/applicant/task-card";
import { Button } from "@/components/ui/button";
// Card not used in this file
import type { MatchResult } from "@/lib/matching/engine";

export default function Page() {
  const [matches, setMatches] = useState<MatchResult | null>(null);

  useEffect(() => {
    void fetch("/api/matches")
      .then(async (response) => response.json())
      .then((data) => setMatches(data));
  }, []);

  return (
    <ApplicantShell
      title="Applicant dashboard"
      description="Your housing process in one place: active applications, document status, and staff support.">
      <div className="grid gap-8">
        <StatusCard />

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] bg-white p-8 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-brand">Application summary</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">Recent activity</h2>
              </div>
              <Button variant="outline">View all applications</Button>
            </div>
            <div className="mt-8 space-y-6">
              <div className="rounded-[28px] border border-border bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Family Support Program</p>
                    <p className="mt-1 text-sm text-slate-600">Waiting for document verification</p>
                  </div>
                  <span className="rounded-full bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">Needs documents</span>
                </div>
              </div>
              <div className="rounded-[28px] border border-border bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Emergency Housing Request</p>
                    <p className="mt-1 text-sm text-slate-600">Staff review in progress</p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">In review</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-brand">Top matches</p>
              <div className="mt-5 grid gap-4">
                {matches?.eligible.slice(0, 3).map((program) => (
                  <div key={program.programId} className="rounded-[28px] border border-border bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-950">{program.programName}</p>
                    <p className="mt-2 text-sm text-slate-600">{program.matchDescription ?? "Your profile is aligned with this opportunity."}</p>
                    <Link href="/matches" className="mt-3 inline-flex text-sm font-semibold text-brand">View all matches →</Link>
                  </div>
                ))}
                {!matches?.eligible.length ? (
                  <div className="rounded-[28px] border border-border bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-950">Update your profile</p>
                    <p className="mt-2 text-sm text-slate-600">Add missing details to unlock more housing matches.</p>
                  </div>
                ) : null}
              </div>
            </div>
            <TaskCards />
          </section>
        </div>
      </div>
    </ApplicantShell>
  );
}
