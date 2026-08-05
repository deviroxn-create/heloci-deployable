"use client";

import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Target, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EligibilitySummaryProps {
  eligibility: {
    score: number | null;
    isEligible: boolean | null;
    evaluatedAt: Date | null;
  };
  matchScore: number | null;
  programName: string;
  metadata?: {
    matchedCriteria?: string[];
    failedCriteria?: string[];
    riskIndicators?: string[];
    recommendationTier?: "high" | "medium" | "low";
  };
}

export function EligibilitySummary({
  eligibility,
  matchScore,
  programName,
  metadata = {},
}: EligibilitySummaryProps) {
  const { matchedCriteria = [], failedCriteria = [], riskIndicators = [], recommendationTier } = metadata;

  const getRecommendationColor = (tier?: string) => {
    if (tier === "high") return "from-success to-success/70";
    if (tier === "medium") return "from-warning to-warning/70";
    if (tier === "low") return "from-slate-400 to-slate-500";
    return "from-brand to-brand/70";
  };

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-950">Eligibility Assessment</h3>
        {eligibility.evaluatedAt && (
          <p className="text-xs text-slate-500">
            Evaluated {new Date(eligibility.evaluatedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Eligibility Score */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-slate-600" />
            <p className="text-xs font-semibold uppercase text-slate-600">Eligibility Score</p>
          </div>
          {eligibility.score !== null ? (
            <p className="text-3xl font-bold text-slate-950">{eligibility.score}</p>
          ) : (
            <p className="text-2xl font-bold text-slate-400">Pending</p>
          )}
        </div>

        {/* Match Score */}
        <div className="rounded-xl bg-gradient-to-br from-brand/10 to-brand/20 p-4 border border-brand/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-brand" />
            <p className="text-xs font-semibold uppercase text-brand">Match Score</p>
          </div>
          {matchScore !== null ? (
            <p className="text-3xl font-bold text-brand">{matchScore}%</p>
          ) : (
            <p className="text-2xl font-bold text-slate-400">—</p>
          )}
        </div>

        {/* Status */}
        <div
          className={`rounded-xl p-4 border ${
            eligibility.isEligible === true
              ? "bg-gradient-to-br from-success/10 to-success/20 border-success/20"
              : eligibility.isEligible === false
                ? "bg-gradient-to-br from-error/10 to-error/20 border-error/20"
                : "bg-gradient-to-br from-slate-50 to-slate-100 border-border"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {eligibility.isEligible === true ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : eligibility.isEligible === false ? (
              <XCircle className="h-4 w-4 text-error" />
            ) : (
              <AlertCircle className="h-4 w-4 text-slate-400" />
            )}
            <p
              className={`text-xs font-semibold uppercase ${
                eligibility.isEligible === true
                  ? "text-success"
                  : eligibility.isEligible === false
                    ? "text-error"
                    : "text-slate-500"
              }`}
            >
              Status
            </p>
          </div>
          <p
            className={`text-2xl font-bold ${
              eligibility.isEligible === true
                ? "text-success"
                : eligibility.isEligible === false
                  ? "text-error"
                  : "text-slate-400"
            }`}
          >
            {eligibility.isEligible === null ? "Pending" : eligibility.isEligible ? "Eligible" : "Ineligible"}
          </p>
        </div>
      </div>

      {/* Recommendation Tier */}
      {recommendationTier && (
        <div className="rounded-xl bg-slate-50 p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getRecommendationColor(recommendationTier)} flex items-center justify-center`}>
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Recommendation Tier</p>
              <p className="text-lg font-bold text-slate-950 capitalize">{recommendationTier} Priority</p>
            </div>
          </div>
        </div>
      )}

      {/* Program Match */}
      <div className="rounded-xl bg-gradient-to-br from-brand/5 to-brand/10 p-4 border border-brand/20">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-brand" />
          <p className="text-sm font-semibold text-slate-950">Program Recommendation</p>
        </div>
        <Badge className="bg-brand/10 text-brand border-brand/20 mb-2">Recommended Match</Badge>
        <p className="text-sm text-slate-700">{programName}</p>
        <p className="text-xs text-slate-600 mt-2">
          This recommendation is derived from the eligibility engine and matching algorithm based on applicant profile and program criteria.
        </p>
      </div>

      {/* Matched Criteria */}
      {matchedCriteria.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">✓ Matched Criteria</p>
          <div className="space-y-1.5">
            {matchedCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-700 bg-success/5 rounded-lg px-3 py-2 border border-success/10">
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                <span>{criterion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Criteria */}
      {failedCriteria.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">✗ Failed Criteria</p>
          <div className="space-y-1.5">
            {failedCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-700 bg-error/5 rounded-lg px-3 py-2 border border-error/10">
                <XCircle className="h-4 w-4 text-error flex-shrink-0" />
                <span>{criterion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Indicators */}
      {riskIndicators.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">⚠ Risk Indicators</p>
          <div className="space-y-1.5">
            {riskIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-700 bg-warning/5 rounded-lg px-3 py-2 border border-warning/10">
                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                <span>{indicator}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why Qualified */}
      {eligibility.isEligible && (
        <div className="rounded-xl bg-gradient-to-br from-success/5 to-success/10 p-4 border border-success/20">
          <p className="text-sm font-semibold text-slate-950 mb-2">Why This Applicant Qualified</p>
          <p className="text-sm text-slate-700">
            The applicant meets all required eligibility criteria for {programName}, including income limits, household composition requirements, and program-specific qualifications. The match score of {matchScore}% indicates a strong fit for this program.
          </p>
        </div>
      )}
    </div>
  );
}
