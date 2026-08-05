"use client";

import { useState } from "react";
import {
  UserPlus,
  MessageSquare,
  FileText,
  Clock,
  PlayCircle,
  StickyNote,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaseActionPanelProps {
  caseId: string;
  onAction?: (action: string) => void;
  missingDocumentsCount?: number;
}

export function CaseActionPanel({ caseId, onAction, missingDocumentsCount = 0 }: CaseActionPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onAction) {
        onAction("refresh");
      }
      // Simulate refresh delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };

  const actions = [
    {
      id: "assign",
      label: "Assign Reviewer",
      icon: UserPlus,
      variant: "outline" as const,
      description: "Assign or reassign this case to a reviewer",
    },
    {
      id: "communicate",
      label: "Open Communication",
      icon: MessageSquare,
      variant: "outline" as const,
      description: "Open the communication center",
    },
    {
      id: "documents",
      label: "Review Documents",
      icon: FileText,
      variant: "outline" as const,
      description: "View and verify uploaded documents",
      badge: missingDocumentsCount > 0 ? missingDocumentsCount : undefined,
    },
    {
      id: "timeline",
      label: "View Timeline",
      icon: Clock,
      variant: "outline" as const,
      description: "See complete case history",
    },
    {
      id: "begin_review",
      label: "Begin Review",
      icon: PlayCircle,
      variant: "primary" as const,
      description: "Start reviewing this application",
      primary: true,
    },
    {
      id: "note",
      label: "Leave Internal Note",
      icon: StickyNote,
      variant: "outline" as const,
      description: "Add private notes for staff",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Actions Card */}
      <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Case Actions</p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            title="Refresh case data"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.id}
                variant={action.variant}
                className={`w-full justify-start gap-3 h-auto py-3 ${
                  action.primary
                    ? "bg-gradient-to-r from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 text-white"
                    : ""
                }`}
                onClick={() => onAction?.(action.id)}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${action.primary ? "text-white" : "text-slate-600"}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${action.primary ? "text-white" : "text-slate-950"}`}>
                    {action.label}
                  </p>
                  {action.description && (
                    <p className={`text-xs ${action.primary ? "text-white/80" : "text-slate-500"}`}>
                      {action.description}
                    </p>
                  )}
                </div>
                {action.badge && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-xs font-bold">
                    {action.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Missing Documents Alert */}
      {missingDocumentsCount > 0 && (
        <div className="rounded-[28px] border border-warning/20 bg-warning/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Missing Documents</p>
              <p className="text-xs text-slate-600 mt-1">
                {missingDocumentsCount} document{missingDocumentsCount !== 1 ? "s" : ""} waiting for submission
              </p>
              <button
                onClick={() => onAction?.("request_documents")}
                className="text-xs font-medium text-warning hover:underline mt-2"
              >
                Request documents →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="rounded-[28px] border border-border bg-gradient-to-br from-slate-50 to-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Review Guidelines</p>
        <ul className="space-y-2 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-brand font-bold mt-0.5">•</span>
            <span>Verify all checklist items before making a decision</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand font-bold mt-0.5">•</span>
            <span>Review all uploaded documents for authenticity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand font-bold mt-0.5">•</span>
            <span>Communicate clearly with applicants about requirements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand font-bold mt-0.5">•</span>
            <span>Document your decision reasoning in internal notes</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
