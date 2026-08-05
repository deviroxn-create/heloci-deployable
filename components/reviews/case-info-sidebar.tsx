"use client";

import { Calendar, Clock, Flag, User, Building, FileText, AlertTriangle, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CaseInfoSidebarProps {
  caseId: string;
  applicationNumber: string;
  programName: string;
  organizationName: string;
  createdDate: Date | null;
  lastUpdated: Date;
  currentStage: string;
  assignedReviewer: { id: string; name: string | null; email: string } | null;
  priority: "high" | "medium" | "low";
  flags: string[];
  timeInQueue?: number; // in days
  slaRemaining?: number; // in days
}

export function CaseInfoSidebar({
  caseId,
  applicationNumber,
  programName,
  organizationName,
  createdDate,
  lastUpdated,
  currentStage,
  assignedReviewer,
  priority,
  flags = [],
  timeInQueue = 0,
  slaRemaining,
}: CaseInfoSidebarProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-error/10 text-error border-error/20">
            High Priority
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Medium Priority
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
            Low Priority
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200">{priority}</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      under_review: "bg-brand/10 text-brand border-brand/20",
      approved: "bg-success/10 text-success border-success/20",
      rejected: "bg-error/10 text-error border-error/20",
      waitlisted: "bg-slate-100 text-slate-600 border-slate-200",
    };

    const stageLabels: Record<string, string> = {
      pending: "Pending",
      under_review: "Under Review",
      approved: "Approved",
      rejected: "Rejected",
      waitlisted: "Waitlisted",
    };

    return (
      <Badge className={stageColors[stage] || "bg-slate-100 text-slate-600"}>
        {stageLabels[stage] || stage}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Case Metadata Card */}
      <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Case Information</p>

        <div className="space-y-3">
          {/* Case Number */}
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Case Number</p>
              <p className="text-sm font-mono text-slate-950 mt-0.5">{applicationNumber}</p>
            </div>
          </div>

          {/* Application ID */}
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Application ID</p>
              <p className="text-xs font-mono text-slate-700 mt-0.5 truncate">{caseId}</p>
            </div>
          </div>

          {/* Program */}
          <div className="flex items-start gap-3">
            <Building className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Program</p>
              <p className="text-sm text-slate-950 mt-0.5">{programName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{organizationName}</p>
            </div>
          </div>

          {/* Created Date */}
          {createdDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500">Created Date</p>
                <p className="text-sm text-slate-700 mt-0.5">{new Date(createdDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Last Updated</p>
              <p className="text-sm text-slate-700 mt-0.5">{new Date(lastUpdated).toLocaleString()}</p>
            </div>
          </div>

          {/* Current Stage */}
          <div className="flex items-start gap-3">
            <Flag className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Current Stage</p>
              {getStageBadge(currentStage)}
            </div>
          </div>

          {/* Assigned Reviewer */}
          {assignedReviewer && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Assigned Reviewer</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                    {assignedReviewer.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-950 truncate">{assignedReviewer.name || "Unknown"}</p>
                    <p className="text-xs text-slate-600 truncate">{assignedReviewer.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Priority</p>
              {getPriorityBadge(priority)}
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking Card */}
      <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Time Tracking</p>

        <div className="space-y-3">
          {/* Time in Queue */}
          <div className="rounded-xl bg-slate-50 p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-semibold uppercase text-slate-500">Time in Queue</p>
            </div>
            <p className="text-2xl font-bold text-slate-950">{timeInQueue} days</p>
          </div>

          {/* SLA Remaining */}
          {slaRemaining !== undefined && (
            <div
              className={`rounded-xl p-4 border ${
                slaRemaining < 2
                  ? "bg-error/10 border-error/20"
                  : slaRemaining < 5
                    ? "bg-warning/10 border-warning/20"
                    : "bg-success/10 border-success/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock
                  className={`h-4 w-4 ${
                    slaRemaining < 2 ? "text-error" : slaRemaining < 5 ? "text-warning" : "text-success"
                  }`}
                />
                <p
                  className={`text-xs font-semibold uppercase ${
                    slaRemaining < 2 ? "text-error" : slaRemaining < 5 ? "text-warning" : "text-success"
                  }`}
                >
                  SLA Remaining
                </p>
              </div>
              <p
                className={`text-2xl font-bold ${
                  slaRemaining < 2 ? "text-error" : slaRemaining < 5 ? "text-warning" : "text-success"
                }`}
              >
                {slaRemaining} days
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flags Card */}
      {flags.length > 0 && (
        <div className="rounded-[28px] border border-warning/20 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="h-4 w-4 text-warning" />
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">Case Flags</p>
          </div>
          <div className="space-y-2">
            {flags.map((flag, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2 border border-warning/10">
                <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
                <p className="text-xs font-medium text-slate-950">{flag}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
