"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ApplicationReadinessCheck } from "@/lib/reviews/decision.types";
import { apiCheckApplicationReadiness } from "@/lib/reviews/decision-api-client";

interface ReadinessWidgetProps {
  applicationId: string;
  onRefresh?: () => void;
}

export function ReadinessWidget({
  applicationId,
  onRefresh,
}: ReadinessWidgetProps) {
  const [readiness, setReadiness] = useState<ApplicationReadinessCheck | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReadiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCheckApplicationReadiness(applicationId);
      if (!response.success) {
        setError(response.error?.message || "Failed to load readiness");
        return;
      }
      setReadiness(response.data || null);
    } catch (err: any) {
      console.error("Error loading readiness:", err);
      setError("Failed to check readiness. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [applicationId]);

  const handleRefresh = async () => {
    await loadReadiness();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card className="p-4 bg-slate-50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-brand animate-spin" />
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

  if (!readiness) {
    return (
      <Card className="p-4 bg-slate-50">
        <p className="text-sm text-slate-500">No readiness data available</p>
      </Card>
    );
  }

  // Determine status color
  let statusColor = "bg-error/10 text-error"; // Red if not ready
  let statusIcon = AlertCircle;

  if (readiness.isReady) {
    statusColor = "bg-success/10 text-success";
    statusIcon = CheckCircle2;
  } else if (readiness.warnings && readiness.warnings.length > 0) {
    statusColor = "bg-warning/10 text-warning";
    statusIcon = AlertTriangle;
  }

  const StatusIcon = statusIcon;

  return (
    <div className="space-y-4">
      {/* Main Status */}
      <Card className={`p-4 ${statusColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <StatusIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">
                {readiness.isReady ? "Ready for Decision" : "Not Yet Ready"}
              </h3>
              <p className="text-xs opacity-75 mt-1">
                {readiness.isReady
                  ? "All requirements met. You can make a decision."
                  : "Complete missing items before making a decision."}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
            title="Refresh readiness check"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Progress Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {/* Checklist Completion */}
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold uppercase text-slate-600 mb-1">
            Checklist
          </p>
          <p className="text-2xl font-bold text-slate-950">
            {readiness.checklistCompletion ? `${readiness.checklistCompletion}%` : "—"}
          </p>
          {readiness.checklistCompletion !== undefined && (
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${readiness.checklistCompletion}%` }}
              />
            </div>
          )}
        </div>

        {/* Documents Verified */}
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold uppercase text-slate-600 mb-1">
            Documents
          </p>
          <p className="text-2xl font-bold text-slate-950">
            {readiness.documentsVerified !== undefined &&
            readiness.documentsTotal !== undefined
              ? `${readiness.documentsVerified}/${readiness.documentsTotal}`
              : "—"}
          </p>
          {readiness.documentsTotal && (
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all"
                style={{
                  width: `${((readiness.documentsVerified || 0) / readiness.documentsTotal) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Overall Status */}
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs font-semibold uppercase text-slate-600 mb-1">
            Status
          </p>
          <p
            className={`text-2xl font-bold ${
              readiness.isReady ? "text-success" : "text-warning"
            }`}
          >
            {readiness.isReady ? "✓" : "!"}
          </p>
        </div>
      </div>

      {/* Warnings */}
      {readiness.warnings && readiness.warnings.length > 0 && (
        <Card className="p-4 border-warning/20 bg-warning/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-950 mb-2">Issues to Address:</p>
              <ul className="space-y-1">
                {readiness.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-warning">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {readiness.recommendations && readiness.recommendations.length > 0 && (
        <Card className="p-4 border-brand/20 bg-brand/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-950 mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {readiness.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-brand">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
