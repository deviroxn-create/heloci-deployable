"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ChevronDown, CheckCircle2, Clock, FileText, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DecisionHistoryRecord } from "@/lib/reviews/decision.types";
import { apiGetDecisionHistory } from "@/lib/reviews/decision-api-client";

interface DecisionHistoryProps {
  applicationId: string;
}

const decisionIcons: Record<string, any> = {
  approved: CheckCircle2,
  conditional_approval: AlertCircle,
  rejected: AlertCircle,
  waitlisted: Clock,
  escalated: FileText,
  needs_info: AlertCircle,
  withdrawn: Lock,
  closed: Lock,
};

const decisionColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  conditional_approval: "bg-warning/10 text-warning",
  rejected: "bg-error/10 text-error",
  waitlisted: "bg-slate-100 text-slate-700",
  escalated: "bg-brand/10 text-brand",
  needs_info: "bg-warning/10 text-warning",
  withdrawn: "bg-slate-100 text-slate-700",
  closed: "bg-slate-100 text-slate-700",
};

const decisionLabels: Record<string, string> = {
  approved: "Approved",
  conditional_approval: "Conditional Approval",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  escalated: "Escalated",
  needs_info: "Needs Information",
  withdrawn: "Withdrawn",
  closed: "Case Closed",
};

export function DecisionHistory({ applicationId }: DecisionHistoryProps) {
  const [decisions, setDecisions] = useState<DecisionHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGetDecisionHistory(applicationId, 100);
        if (!response.success) {
          setError(response.error?.message || "Failed to load");
          return;
        }
        setDecisions(response.data?.decisions || []);
      } catch (err: any) {
        setError("Failed to load decision history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [applicationId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-brand animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!decisions || decisions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No decisions made yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((decision, idx) => {
        const Icon = decisionIcons[decision.decision] || FileText;
        const colorClass = decisionColors[decision.decision] || "bg-slate-50";
        const label = decisionLabels[decision.decision] || decision.decision;
        const isExpanded = expandedId === decision.id;

        return (
          <div key={decision.id}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : decision.id)}
              className="w-full text-left"
            >
              <Card className="p-4 hover:shadow-md transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {idx < decisions.length - 1 && <div className="h-8 w-0.5 bg-slate-200" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-950">{label}</h4>
                      {decision.isActive && <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-medium">Current</span>}
                      {decision.supersededBy && <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">Superseded</span>}
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">{decision.decidedBy.name || "Unknown"}</span>
                        <span className="text-xs text-slate-400">{decision.decidedBy.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(decision.decidedAt).toLocaleString()}
                      </div>
                    </div>

                    {decision.reason && <p className="mt-2 text-sm text-slate-700 line-clamp-2">{decision.reason}</p>}

                    <ChevronDown className={`h-4 w-4 text-slate-400 mt-2 transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </Card>
            </button>

            {isExpanded && (
              <Card className="ml-14 mt-2 p-4 bg-slate-50">
                <div className="space-y-3">
                  {decision.reason && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Reason</p>
                      <p className="text-sm text-slate-700">{decision.reason}</p>
                    </div>
                  )}

                  {decision.applicantMessage && (
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Message</p>
                      <div className="bg-white rounded p-2 text-sm text-slate-700 border border-slate-200">{decision.applicantMessage}</div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Reviewer</p>
                      <p className="text-slate-950">{decision.decidedBy.name}</p>
                      <p className="text-xs text-slate-500">{decision.decidedBy.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Date</p>
                      <p className="text-slate-950">{new Date(decision.decidedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">{new Date(decision.decidedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
