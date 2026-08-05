"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Compass, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MatchResult, ProgramMatch } from "@/lib/matching/engine";

type AvailableProgram = {
  id: string;
  name: string;
  slug: string;
  matchDescription?: string | null;
  category?: string | null;
  deadline?: string | null;
};

function formatDeadline(value?: Date | string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function ApplyLandingPage() {
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [programs, setPrograms] = useState<AvailableProgram[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const filteredPrograms = useMemo(
    () => programs.filter((program) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return (
        program.name.toLowerCase().includes(query) ||
        (program.matchDescription ?? "").toLowerCase().includes(query) ||
        (program.category ?? "").toLowerCase().includes(query)
      );
    }),
    [programs, searchTerm]
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const [matchesResponse, programsResponse] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/programs")
        ]);

        const matchesData = await matchesResponse.json();
        const programsData = await programsResponse.json();

        if (matchesResponse.ok) {
          setMatches(matchesData);
        } else {
          setWarning(matchesData.error || "Unable to load application recommendations.");
        }

        if (programsResponse.ok) {
          setPrograms(programsData);
        } else {
          const programError = programsData.error || "Unable to load available programs.";
          setError(programError);
          if (!matchesResponse.ok) {
            throw new Error(programError);
          }
        }
      } catch (err) {
        setError((err as Error).message || "Unable to load application options.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">New application</p>
            <h1 className="text-4xl font-semibold text-slate-950">Choose a program and continue with confidence.</h1>
            <p className="max-w-2xl text-sm text-slate-600">Start with the program that fits your goals, then move through a guided application that keeps you informed about the next step.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/matches">View recommendations</Link>
            </Button>
            <Button asChild>
              <Link href="/check-eligibility">Refresh eligibility</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="rounded-[16px] p-8 text-slate-600">Loading available programs…</Card>
        ) : error ? (
          <Card className="rounded-[16px] p-8 text-red-600">{error}</Card>
        ) : (
          <div className="space-y-8">
            {warning ? (
              <Card className="rounded-[16px] border border-amber-200 bg-amber-50 p-6 text-amber-800">
                {warning}
              </Card>
            ) : null}

            <section className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#006AFF]/10 px-3 py-1 font-semibold text-[#006AFF]">
                    <Sparkles className="h-4 w-4" /> Eligibility is advisory
                  </span>
                  <span>Programs may require extra review or documentation, but you can continue to apply when you choose.</span>
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Browse housing programs</h2>
                  <p className="text-sm text-slate-600">Choose a program to apply for and start the application only when you're ready.</p>
                </div>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search programs by name, category, or description"
                  className="max-w-xl"
                />
              </div>

              {filteredPrograms.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {filteredPrograms.map((program) => (
                    <Card key={program.id} className="rounded-[16px] p-6 shadow-soft">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-950">{program.name}</h3>
                          {program.matchDescription ? <p className="mt-2 text-sm text-slate-600">{program.matchDescription}</p> : null}
                          {program.category ? <p className="mt-2 text-sm text-slate-500">Category: {program.category}</p> : null}
                        </div>
                        {program.deadline ? <Badge className="bg-rose-100 text-rose-700">Deadline {formatDeadline(program.deadline)}</Badge> : null}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                          <Link href={`/programs/${program.slug}`}>
                            <span className="flex items-center gap-2"><Compass className="h-4 w-4" /> View details</span>
                          </Link>
                        </Button>
                        <Button asChild className="rounded-full bg-[#006AFF] text-white hover:bg-[#0057e6]">
                          <Link href={`/apply/${program.slug}`}>
                            <span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" /> Start application</span>
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="rounded-[16px] p-8">
                  <p className="text-slate-700">No programs match your search. Try a different keyword or broaden your filter.</p>
                </Card>
              )}
            </section>

            {(matches?.eligible.length ?? 0) > 0 || (matches?.nearlyEligible.length ?? 0) > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Recommended programs</h2>
                    <p className="text-sm text-slate-600">Based on your profile and eligibility results.</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {matches?.eligible.map((program) => (
                    <ProgramCard key={program.programId} program={program} />
                  ))}
                  {matches?.nearlyEligible.map((program) => (
                    <ProgramCard key={program.programId} program={program} />
                  ))}
                </div>
              </section>
            ) : null}

            {(!matches || (matches.eligible.length === 0 && matches.nearlyEligible.length === 0)) && programs.length === 0 ? (
              <Card className="rounded-[16px] p-8">
                <p className="mb-4 text-slate-700">No programs or recommendations are available yet. Update your profile or check eligibility to improve your matches.</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href="/check-eligibility">Update profile</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/check-eligibility">Check eligibility</Link>
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: ProgramMatch }) {
  return (
    <Card className="rounded-[16px] p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{program.programName}</h3>
          {program.matchDescription ? <p className="mt-2 text-sm text-slate-600">{program.matchDescription}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={program.isEligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
            Score: {program.score}/100
          </Badge>
          {program.deadline ? <Badge className="bg-rose-100 text-rose-700">Deadline {formatDeadline(program.deadline)}</Badge> : null}
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        {program.matched.length > 0 ? (
          <div>
            <p className="font-semibold text-slate-800">Why you qualify</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {program.matched.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ) : null}

        {program.failed.length > 0 ? (
          <div>
            <p className="font-semibold text-slate-800">What you still need</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {program.failed.map((item) => <li key={item}>{item}</li>)}
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
