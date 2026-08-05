"use server";

import { prisma } from "@/lib/prisma/client";
import { calculateProfileCompleteness, loadApplicantProfile } from "@/services/applicant-profile.service";
import { runEligibilityEngine as executeEngine } from "./engine";

export type PassportProgram = {
  id: string;
  name: string;
  slug: string;
  housing_goal: string | null;
  missing_fields: number;
  total_fields: number;
  percent_complete: number;
};

export type EligibilityEngineResult = {
  eligiblePrograms: Awaited<ReturnType<typeof executeEngine>>;
  passportPrograms: PassportProgram[];
};

export async function runEligibilityEngine(userId: string): Promise<EligibilityEngineResult> {
  const eligiblePrograms = await executeEngine(userId);

  const profile = await loadApplicantProfile(userId);
  const completeness = calculateProfileCompleteness(profile);
  const totalFields = 6;
  const answeredCount = completeness.completedSections.length;
  const percentComplete = completeness.score;

  const programs = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string; housing_goal: string | null }>>`
    SELECT id, name, slug, housing_goal FROM programs WHERE status = 'active'
  `;

  const passportPrograms: PassportProgram[] = (programs ?? []).map((program: any) => ({
    id: program.id,
    name: program.name,
    slug: program.slug,
    housing_goal: program.housing_goal,
    missing_fields: Math.max(0, totalFields - answeredCount),
    total_fields: totalFields,
    percent_complete: percentComplete
  }));

  return {
    eligiblePrograms,
    passportPrograms
  };
}
