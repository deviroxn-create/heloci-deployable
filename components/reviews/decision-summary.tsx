"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import type { CaseDetail } from "@/lib/cases/case-service";

interface DecisionSummaryProps {
  caseData: CaseDetail;
  readinessComponent: React.ReactNode;
}

export function DecisionSummary({
  caseData,
  readinessComponent,
}: DecisionSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Application Status */}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
          Application Status
        </p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brand"></div>
          <p className="font-semibold text-slate-950">Under Review</p>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Submitted {caseData.submittedAt
            ? new Date(caseData.submittedAt).toLocaleDateString()
            : "Unknown"}
        </p>
      </Card>

      {/* Readiness Widget */}
      {readinessComponent}

      {/* Case Information */}
      <Card className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Applicant
          </p>
          <p className="font-semibold text-slate-950 mt-1">
            {caseData.applicant.name}
          </p>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Program
          </p>
          <p className="font-semibold text-slate-950 mt-1">
            {caseData.program.name}
          </p>
        </div>

        {caseData.assignedTo && (
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Reviewer
            </p>
            <p className="font-semibold text-slate-950 mt-1">
              {caseData.assignedTo.name}
            </p>
            <p className="text-xs text-slate-500">{caseData.assignedTo.email}</p>
          </div>
        )}

        {caseData.program && (
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Organization
            </p>
            <p className="font-semibold text-slate-950 mt-1">
              {caseData.program.organizationId}
            </p>
          </div>
        )}

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Submitted
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            {caseData.submittedAt
              ? new Date(caseData.submittedAt).toLocaleString()
              : "Unknown"}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Last Updated
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            {new Date(caseData.lastActivityAt).toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-brand">
            {caseData.matchScore || "—"}
          </p>
          <p className="text-xs text-slate-600">Match Score</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">
            {caseData.metadata?.householdSize || "—"}
          </p>
          <p className="text-xs text-slate-600">Household Size</p>
        </Card>
      </div>
    </div>
  );
}
