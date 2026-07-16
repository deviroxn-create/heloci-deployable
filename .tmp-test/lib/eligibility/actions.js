"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEligibilityEngine = runEligibilityEngine;
const client_1 = require("@/lib/prisma/client");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
const engine_1 = require("./engine");
async function runEligibilityEngine(userId) {
    const eligiblePrograms = await (0, engine_1.runEligibilityEngine)(userId);
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    const questions = await client_1.prisma.$queryRaw `
    SELECT key FROM questions WHERE is_universal = true
  `;
    const totalFields = questions?.length ?? 0;
    const answeredCount = questions?.filter((question) => {
        const value = profile?.[question.key];
        return value !== undefined && value !== null && value !== "";
    }).length ?? 0;
    const percentComplete = totalFields > 0 ? Math.round((answeredCount / totalFields) * 100) : 0;
    const programs = await client_1.prisma.$queryRaw `
    SELECT id, name, slug, housing_goal FROM programs WHERE status = 'active'
  `;
    const passportPrograms = (programs ?? []).map((program) => ({
        id: program.id,
        name: program.name,
        slug: program.slug,
        housing_goal: program.housing_goal,
        missing_fields: totalFields - answeredCount,
        total_fields: totalFields,
        percent_complete: percentComplete
    }));
    return {
        eligiblePrograms,
        passportPrograms
    };
}
