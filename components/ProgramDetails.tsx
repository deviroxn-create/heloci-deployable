"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProgramProp = {
  id: string;
  name: string;
  slug: string;
  organization?: { id: string; name: string } | null;
  housingGoal?: string | null;
  category?: string | null;
  matchDescription?: string | null;
  summary?: string | null;
  description?: string | null;
  deadline?: string | null;
  hasQuestionSet?: boolean;
};

export default function ProgramDetails({ program }: { program: ProgramProp }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{program.name}</h1>
          {program.organization ? <p className="text-sm text-slate-600">{program.organization.name}</p> : null}
          {program.housingGoal ? <p className="mt-2 text-sm text-slate-700">Goal: {program.housingGoal}</p> : null}
          {program.category ? <p className="mt-1 text-sm text-slate-500">Category: {program.category}</p> : null}

          {program.summary ? <p className="mt-4 text-sm text-slate-700">{program.summary}</p> : null}
          {program.description ? <div className="mt-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: program.description }} /> : null}
        </div>

        <div className="flex flex-col items-end gap-3">
          {program.deadline ? <p className="text-sm text-slate-500">Deadline: {new Date(program.deadline).toLocaleDateString()}</p> : null}
          <div className="flex flex-col gap-2 w-40">
            <Button asChild>
              <Link href={`/eligibility/assistant?program=${program.slug}`}>Check eligibility</Link>
            </Button>
            {program.hasQuestionSet ? (
              <Button asChild>
                <Link href={`/apply/${program.slug}`}>Start application</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>Application not available</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
