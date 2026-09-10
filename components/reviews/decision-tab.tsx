"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CaseDetail } from "@/lib/cases/case-service";
import { DecisionSummary } from "./decision-summary";
import { DecisionWorkspace } from "./decision-workspace";
import { ReadinessWidget } from "./readiness-widget";
import type { ApplicationReadinessCheck } from "@/lib/reviews/decision.types";
import { apiCheckApplicationReadiness } from "@/lib/reviews/decision-api-client";

interface DecisionTabProps {
  caseData: CaseDetail;
  caseId: string;
  onRefresh?: () => void;
}

export function DecisionTab({
  caseData,
  caseId,
  onRefresh,
}: DecisionTabProps) {
  const [readiness, setReadiness] = useState<ApplicationReadinessCheck | null>(
    null
  );
  const [loadingReadiness, setLoadingReadiness] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReadiness = async () => {
    try {
      setLoadingReadiness(true);
      setError(null);
      const response = await apiCheckApplicationReadiness(caseId);
      if (!response.success) {
        setError(response.error?.message || "Failed to load readiness");
        return;
      }
      setReadiness(response.data || null);
    } catch (err: any) {
      console.error("Error loading readiness:", err);
      setError("Failed to check readiness");
    } finally {
      setLoadingReadiness(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [caseId, refreshKey]);

  const handleRefreshReadiness = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleDecisionMade = () => {
    // Refresh readiness and trigger parent refresh
    handleRefreshReadiness();
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Two-column Layout: Desktop/Tablet */}
      {loadingReadiness ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-brand animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading readiness check...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[350px_1fr] w-full">
          {/* Left Column: Decision Summary */}
          <div className="order-2 lg:order-1">
            <DecisionSummary
              caseData={caseData}
              readinessComponent={
                <ReadinessWidget
                  applicationId={caseId}
                  onRefresh={handleRefreshReadiness}
                />
              }
            />
          </div>

          {/* Right Column: Decision Workspace */}
          <div className="order-1 lg:order-2">
            <DecisionWorkspace
              applicationId={caseId}
              organizationId={caseData.program.organizationId}
              applicantName={caseData.applicant.name || "Applicant"}
              isReady={readiness?.isReady || false}
              onDecisionMade={handleDecisionMade}
            />
          </div>
        </div>
      )}
    </div>
  );
}
