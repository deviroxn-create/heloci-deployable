"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  MessageSquare,
  Check,
  X,
  RefreshCw,
  Loader2,
  Download,
  Eye,
  XCircle,
  CheckCircle,
  RotateCcw,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveActiveTab, type CaseTabId } from "@/lib/admin/case-tabs";
import type { CaseDetail } from "@/lib/cases/case-service";
import { Badge } from "@/components/ui/badge";
import { DocumentReviewWorkspace } from "@/components/reviews/document-review-workspace";
import { DecisionTab } from "@/components/reviews/decision-tab";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  under_review: "bg-brand/10 text-brand",
  approved: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  waitlisted: "bg-slate-100 text-slate-700",
  assigned: "bg-brand/10 text-brand",
  waiting_documents: "bg-warning/10 text-warning"
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  assigned: "Assigned",
  waiting_documents: "Waiting Documents"
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = params?.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CaseTabId>("profile");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setActiveTab(resolveActiveTab(searchParams.get("tab")));
  }, [searchParams]);

  const refreshCase = async () => {
    if (!caseId) return;
    try {
      const response = await fetch(`/api/cases/${caseId}`);
      if (!response.ok) throw new Error("Failed to refresh case");
      const data = await response.json();
      setCaseData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error refreshing case:", err);
    }
  };

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cases/${caseId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch case");
        }
        const data = await response.json();
        setCaseData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching case:", err);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId, refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[28px] border border-border bg-white p-8 shadow-soft text-center">
            <p className="text-slate-500">Loading case...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/admin/applications">
            <button className="flex items-center gap-2 text-brand font-semibold mb-4 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to cases
            </button>
          </Link>
          <div className="rounded-[28px] border border-error/20 bg-error/5 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-3" />
            <p className="text-error font-semibold">{error || "Case not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/applications">
                <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-950">{caseData.applicant.name || "Unknown Applicant"}</h1>
                <p className="text-sm text-slate-500">{caseData.program.name} • Submitted {caseData.submittedAt ? new Date(caseData.submittedAt).toLocaleDateString() : "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyles[caseData.status] || "bg-slate-100 text-slate-700"}`}>
                {statusLabels[caseData.status] || caseData.status}
              </span>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-slate-50">
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid gap-6 lg:grid-cols-[300px_1fr_320px]">
        {/* Left Sidebar: Applicant Summary */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft h-fit sticky top-20">
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-2xl font-bold text-brand mb-3">
              {caseData.applicant.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{caseData.applicant.name || "Unknown"}</h2>
            <p className="text-xs text-slate-500 mt-1">{caseData.applicant.email}</p>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Household Size</p>
              <p className="text-lg font-bold text-slate-950 mt-1">{caseData.metadata?.householdSize || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Income</p>
              <p className="text-lg font-bold text-slate-950 mt-1">
                {caseData.metadata?.income ? `$${caseData.metadata.income.toLocaleString()}` : "-"}
              </p>
            </div>
            {caseData.matchScore && (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Match Score</p>
                <p className="text-lg font-bold text-brand mt-1">{caseData.matchScore}%</p>
              </div>
            )}
            <div className="space-y-2 border-t border-border pt-4">
              {caseData.metadata?.veteranStatus && (
                <div className="flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-700">Veteran</p>
                </div>
              )}
              {caseData.metadata?.disabilityStatus && (
                <div className="flex items-center gap-2 rounded-lg bg-info/5 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-info flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-700">Disability</p>
                </div>
              )}
              {caseData.metadata?.publicWorkerStatus && (
                <div className="flex items-center gap-2 rounded-lg bg-brand/5 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-700">Public Worker</p>
                </div>
              )}
            </div>
          </div>

          {caseData.assignedTo && (
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Assigned To</p>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                  {caseData.assignedTo.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 truncate">{caseData.assignedTo.name}</p>
                  <p className="text-xs text-slate-500 truncate">{caseData.assignedTo.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Case Details */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
            {[
              { id: "communication", label: "Communication", icon: MessageSquare },
              { id: "profile", label: "Profile" },
              { id: "application", label: "Application" },
              { id: "eligibility", label: "Eligibility" },
              { id: "checklist", label: "Checklist" },
              { id: "documents", label: "Documents" },
              { id: "decision", label: "Decision" },
              { id: "timeline", label: "Timeline" },
              { id: "audit", label: "Audit" },
              { id: "notes", label: "Notes" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const nextTab = tab.id as CaseTabId;
                  setActiveTab(nextTab);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("tab", nextTab);
                  router.replace(`/admin/cases/${caseId}?${params.toString()}`, { scroll: false });
                }}
                className={`shrink-0 px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-brand border-b-2 border-brand"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "communication" && <CommunicationTab caseData={caseData} caseId={caseId} />}
          {activeTab === "profile" && <ProfileTab caseData={caseData} />}
          {activeTab === "application" && <ApplicationTab caseData={caseData} />}
          {activeTab === "eligibility" && <EligibilityTab caseData={caseData} />}
          {activeTab === "checklist" && <ChecklistTab caseId={caseId} />}
          {activeTab === "documents" && (
            <DocumentReviewWorkspace 
              caseId={caseId}
              programRequiredDocuments={caseData.program.requiredDocuments || []}
            />
          )}
          {activeTab === "decision" && (
            <DecisionTab
              caseData={caseData}
              caseId={caseId}
              onRefresh={() => void refreshCase()}
            />
          )}
          {activeTab === "timeline" && <TimelineTab caseData={caseData} />}
          {activeTab === "audit" && <AuditTab caseData={caseData} />}
          {activeTab === "notes" && <NotesTab caseData={caseData} caseId={caseId} />}
        </div>

        {/* Right Sidebar: Case Actions */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Case Actions</p>
            <div className="space-y-2">
              <button className="w-full rounded-xl bg-brand/10 text-brand px-4 py-2.5 text-sm font-medium hover:bg-brand/20 transition" onClick={() => { void refreshCase(); }}>
                Refresh Case
              </button>
              <button className="w-full rounded-xl bg-slate-100 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-200 transition" onClick={() => setActiveTab("communication")}>
                Open Communication
              </button>
              <button className="w-full rounded-xl bg-success/10 text-success px-4 py-2.5 text-sm font-medium hover:bg-success/20 transition" onClick={async () => {
                await fetch(`/api/cases/${caseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateStatus", status: "approved" }) });
                setRefreshKey((k) => k + 1);
              }}>
                Approve
              </button>
              <button className="w-full rounded-xl bg-error/10 text-error px-4 py-2.5 text-sm font-medium hover:bg-error/20 transition" onClick={async () => {
                await fetch(`/api/cases/${caseId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "updateStatus", status: "rejected" }) });
                setRefreshKey((k) => k + 1);
              }}>
                Reject
              </button>
              <button className="w-full rounded-xl bg-slate-100 text-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-200 transition" onClick={() => setActiveTab("documents")}>
                Review Documents
              </button>
            </div>
          </div>

          {/* Missing Documents Alert */}
          {caseData.documentRequests.some((dr) => dr.status === "pending") && (
            <div className="rounded-[28px] border border-warning/20 bg-warning/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Missing Documents</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {caseData.documentRequests.filter((dr) => dr.status === "pending").length} document(s) waiting for submission
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Case ID</p>
              <p className="text-sm font-mono text-slate-950">{caseData.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Submitted</p>
              <p className="text-sm text-slate-700">{caseData.submittedAt ? new Date(caseData.submittedAt).toLocaleString() : "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Last Activity</p>
              <p className="text-sm text-slate-700">{new Date(caseData.lastActivityAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Components

function ChecklistTab({ caseId }: { caseId: string }) {
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadChecklist();
  }, [caseId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cases/${caseId}/checklist`);
      if (!response.ok) throw new Error("Failed to load checklist");
      const result = await response.json();
      setChecklist(result.data);
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentStatus: boolean) => {
    try {
      setUpdating(itemId);
      const response = await fetch(`/api/cases/${caseId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateItem",
          itemId,
          completed: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update item");
      await loadChecklist();
    } catch (error) {
      console.error("Error updating checklist item:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the entire checklist?")) return;
    
    try {
      const response = await fetch(`/api/cases/${caseId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (!response.ok) throw new Error("Failed to reset checklist");
      await loadChecklist();
    } catch (error) {
      console.error("Error resetting checklist:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="text-center py-8 text-slate-500">
        Failed to load checklist
      </div>
    );
  }

  const { items, completedItems, totalItems, completionRate } = checklist;

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Review Progress</p>
            <p className="text-xs text-slate-500 mt-1">
              {completedItems} of {totalItems} items completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand">
              {Math.round(completionRate * 100)}%
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-700 mt-1 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${completionRate * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item: any) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 transition ${
              item.completed
                ? "bg-success/5 border-success/20"
                : "bg-white border-border hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => handleToggleItem(item.id, item.completed)}
                disabled={updating === item.id}
                className={`flex-shrink-0 h-6 w-6 rounded-lg border-2 transition flex items-center justify-center ${
                  item.completed
                    ? "bg-success border-success text-white"
                    : "border-slate-300 hover:border-brand"
                } ${updating === item.id ? "opacity-50 cursor-wait" : ""}`}
              >
                {updating === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : item.completed ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </button>

              {/* Item Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${
                      item.completed ? "text-slate-600 line-through" : "text-slate-950"
                    }`}
                  >
                    {item.label}
                  </p>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>

                {item.completedAt && item.completedByUser && (
                  <p className="text-xs text-slate-500 mt-1">
                    Completed by {item.completedByUser.name || "Unknown"} on{" "}
                    {new Date(item.completedAt).toLocaleString()}
                  </p>
                )}

                {item.notes && (
                  <div className="mt-2 text-xs text-slate-600 bg-white rounded p-2 border border-slate-200">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          onClick={() => {
            items.forEach((item: any) => {
              if (!item.completed) handleToggleItem(item.id, false);
            });
          }}
          className="px-4 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20"
        >
          Complete All
        </button>
        <button
          onClick={loadChecklist}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
          <p className="text-sm font-medium text-slate-950 mt-2">{caseData.applicant.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Program</p>
          <p className="text-sm font-medium text-slate-950 mt-2">{caseData.program.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className="text-sm font-medium text-slate-950 mt-2">{statusLabels[caseData.status] || caseData.status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Assigned To</p>
          <p className="text-sm font-medium text-slate-950 mt-2">{caseData.assignedTo?.name || "Unassigned"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Applicant summary</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
          <div><span className="font-medium">Household size:</span> {caseData.metadata?.householdSize ?? "—"}</div>
          <div><span className="font-medium">Income:</span> {caseData.metadata?.income ? `$${caseData.metadata.income.toLocaleString()}` : "—"}</div>
          <div><span className="font-medium">Veteran:</span> {caseData.metadata?.veteranStatus ? "Yes" : "No"}</div>
          <div><span className="font-medium">Disability:</span> {caseData.metadata?.disabilityStatus ? "Yes" : "No"}</div>
        </div>
      </div>
    </div>
  );
}

function ApplicationTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950 mb-3">Submitted Data</p>
        <div className="space-y-2 text-sm text-slate-700">
          {Object.entries(caseData.applicationData).map(([key, value]) => (
            <div key={key} className="flex justify-between py-2 border-b border-slate-200 last:border-0">
              <span className="font-medium text-slate-600">{key}</span>
              <span className="text-slate-950">{String(value || "-")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EligibilityTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Eligibility Score</p>
          <p className="text-2xl font-bold text-slate-950 mt-2">{caseData.eligibility.score ?? "-"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
          <p className={`text-lg font-bold mt-2 ${caseData.eligibility.isEligible ? "text-success" : "text-error"}`}>
            {caseData.eligibility.isEligible === null ? "Pending" : caseData.eligibility.isEligible ? "Eligible" : "Ineligible"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-semibold text-slate-950">Program recommendation</p>
        <div className="mt-3 flex items-center gap-2">
          <Badge className="bg-brand/10 text-brand">Recommended match</Badge>
          <span className="text-sm text-slate-600">{caseData.program.name}</span>
        </div>
        <p className="mt-3 text-sm text-slate-600">The recommendation is derived from the existing eligibility and match data for this application.</p>
      </div>
    </div>
  );
}

function DocumentsTab({ caseData, caseId }: { caseData: CaseDetail; caseId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Review action state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [replaceReason, setReplaceReason] = useState("");
  const [replaceDeadline, setReplaceDeadline] = useState("");
  const [replaceInstructions, setReplaceInstructions] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cases/${caseId}/documents`);
      if (!response.ok) throw new Error("Failed to load documents");
      const result = await response.json();
      setDocuments(result.data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (docId: string, action: string, params?: any) => {
    try {
      setActionLoading(docId);
      const response = await fetch(`/api/cases/${caseId}/documents/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Action failed");
      }

      // Reload documents and close dialogs
      await loadDocuments();
      setShowRejectDialog(false);
      setShowReplaceDialog(false);
      setRejectReason("");
      setReplaceReason("");
      setReplaceDeadline("");
      setReplaceInstructions("");
      setReviewNotes("");
      
      // If this was the selected document, refresh selection
      if (selectedDoc?.id === docId) {
        const updated = documents.find(d => d.id === docId);
        if (updated) setSelectedDoc(updated);
      }
    } catch (error: any) {
      console.error("Error performing action:", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: string, params?: any) => {
    if (selectedDocs.size === 0) {
      alert("Please select documents first");
      return;
    }

    if (!confirm(`${action} ${selectedDocs.size} document(s)?`)) return;

    try {
      setActionLoading("bulk");
      const response = await fetch(`/api/cases/${caseId}/documents/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          documentIds: Array.from(selectedDocs),
          ...params,
        }),
      });

      if (!response.ok) throw new Error("Bulk action failed");

      const result = await response.json();
      alert(`Success: ${result.data.success}, Failed: ${result.data.failed}`);
      
      await loadDocuments();
      setSelectedDocs(new Set());
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      alert(`Failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = (docId: string) => {
    if (!confirm("Approve this document?")) return;
    handleDocumentAction(docId, "approve", { notes: reviewNotes || undefined });
  };

  const handleReject = (docId: string) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    handleDocumentAction(docId, "reject", {
      reason: rejectReason,
      notes: reviewNotes || undefined,
    });
  };

  const handleRequestReplacement = (docId: string) => {
    if (!replaceReason.trim()) {
      alert("Please provide a replacement reason");
      return;
    }
    handleDocumentAction(docId, "request_replacement", {
      reason: replaceReason,
      deadline: replaceDeadline || undefined,
      instructions: replaceInstructions || undefined,
    });
  };

  const toggleDocSelection = (docId: string) => {
    const newSelection = new Set(selectedDocs);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocs(newSelection);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning",
      verified: "bg-success/10 text-success",
      rejected: "bg-error/10 text-error",
      needs_replacement: "bg-info/10 text-info",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      verified: "Approved",
      rejected: "Rejected",
      needs_replacement: "Replacement Requested",
    };
    return labels[status] || status;
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      filterStatus === "all" ||
      (doc.verification?.status || "pending") === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
      {/* Left Panel: Document List */}
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "verified", "rejected", "needs_replacement"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  filterStatus === status
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "all" ? "All" : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <div className="rounded-xl bg-brand/5 border border-brand/20 p-3">
            <p className="text-sm font-medium text-slate-950 mb-2">
              {selectedDocs.size} selected
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={actionLoading === "bulk"}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
              >
                Approve All
              </button>
              <button
                onClick={() => {
                  const reason = prompt("Rejection reason:");
                  if (reason) handleBulkAction("reject", { reason });
                }}
                disabled={actionLoading === "bulk"}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 disabled:opacity-50"
              >
                Reject All
              </button>
              <button
                onClick={() => setSelectedDocs(new Set())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredDocs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              {documents.length === 0 ? "No documents uploaded yet" : "No documents match your filter"}
            </p>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`rounded-xl border p-3 cursor-pointer transition ${
                  selectedDoc?.id === doc.id
                    ? "border-brand bg-brand/5"
                    : "border-border hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleDocSelection(doc.id);
                    }}
                    className="mt-1"
                  />
                  <FileText className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-950 truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.type}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
                          doc.verification?.status || "pending"
                        )}`}
                      >
                        {getStatusLabel(doc.verification?.status || "pending")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Document Details & Actions */}
      <div className="rounded-xl border border-border bg-white p-6">
        {!selectedDoc ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-950">No document selected</p>
            <p className="text-xs text-slate-500 mt-1">
              Click a document from the list to review it
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-950">{selectedDoc.fileName}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    selectedDoc.verification?.status || "pending"
                  )}`}
                >
                  {getStatusLabel(selectedDoc.verification?.status || "pending")}
                </span>
                <span className="text-xs text-slate-500">
                  Uploaded {new Date(selectedDoc.uploadedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Document Metadata */}
            <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Type:</span>
                <span className="font-medium text-slate-950">{selectedDoc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Uploaded by:</span>
                <span className="font-medium text-slate-950">
                  {selectedDoc.uploadedBy.name || selectedDoc.uploadedBy.email}
                </span>
              </div>
              {selectedDoc.verification?.reviewedByUser && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Reviewed by:</span>
                  <span className="font-medium text-slate-950">
                    {selectedDoc.verification.reviewedByUser.name || "Unknown"}
                  </span>
                </div>
              )}
              {selectedDoc.verification?.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Reviewed at:</span>
                  <span className="font-medium text-slate-950">
                    {new Date(selectedDoc.verification.reviewedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Review Notes */}
            {selectedDoc.verification?.notes && (
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Internal Review Notes
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedDoc.verification.notes}
                </p>
              </div>
            )}

            {/* Rejection Reason */}
            {selectedDoc.verification?.rejectionReason && (
              <div className="rounded-xl bg-error/5 border border-error/20 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Rejection Reason
                </p>
                <p className="text-sm text-slate-700">
                  {selectedDoc.verification.rejectionReason}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex gap-2">
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </a>
                <a
                  href={selectedDoc.fileUrl}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>

              <button
                onClick={() => handleApprove(selectedDoc.id)}
                disabled={actionLoading === selectedDoc.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition disabled:opacity-50"
              >
                {actionLoading === selectedDoc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve Document
              </button>

              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading === selectedDoc.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject Document
              </button>

              <button
                onClick={() => setShowReplaceDialog(true)}
                disabled={actionLoading === selectedDoc.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-info/10 text-info text-sm font-medium hover:bg-info/20 transition disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Request Replacement
              </button>

              <button
                onClick={() => handleDocumentAction(selectedDoc.id, "mark_pending")}
                disabled={actionLoading === selectedDoc.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Mark as Pending
              </button>
            </div>
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-slate-950 mb-4">Reject Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Why is this document being rejected?"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Internal staff notes (not visible to applicant)"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason("");
                      setReviewNotes("");
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedDoc.id)}
                    disabled={!rejectReason.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/90 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replace Dialog */}
        {showReplaceDialog && selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-slate-950 mb-4">Request Replacement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    placeholder="Why does this document need to be replaced?"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={replaceDeadline}
                    onChange={(e) => setReplaceDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Instructions (Optional)
                  </label>
                  <textarea
                    value={replaceInstructions}
                    onChange={(e) => setReplaceInstructions(e.target.value)}
                    placeholder="Additional instructions for the applicant"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowReplaceDialog(false);
                      setReplaceReason("");
                      setReplaceDeadline("");
                      setReplaceInstructions("");
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRequestReplacement(selectedDoc.id)}
                    disabled={!replaceReason.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
                  >
                    Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="space-y-4">
      {caseData.events.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No events yet</p>
      ) : (
        caseData.events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-brand" />
              </div>
              {caseData.events.indexOf(event) < caseData.events.length - 1 && (
                <div className="h-8 w-0.5 bg-border mt-2" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-slate-950">{event.description}</p>
              {event.actor && (
                <p className="text-xs text-slate-500 mt-1">{event.actor.name}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AuditTab({ caseData }: { caseData: CaseDetail }) {
  return (
    <div className="space-y-3">
      {caseData.events.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No audit activity recorded yet</p>
      ) : (
        caseData.events.map((event) => (
          <div key={event.id} className="rounded-xl border border-border bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-950">{event.description}</p>
              <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            {event.actor && <p className="mt-2 text-xs text-slate-500">Actor: {event.actor.name || "Unknown"}</p>}
          </div>
        ))
      )}
    </div>
  );
}

function NotesTab({ caseData, caseId }: { caseData: CaseDetail; caseId: string }) {
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addNote", note: noteText })
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      setNoteText("");
      // In a real app, would refresh case data here
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Add an internal note..."
        className="w-full h-24 rounded-xl border border-border px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        onClick={handleAddNote}
        disabled={!noteText.trim() || submitting}
        className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add Note"}
      </button>

      {caseData.internalNotes && (
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Previous Notes</p>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono">
            {caseData.internalNotes}
          </div>
        </div>
      )}
    </div>
  );
}

function CommunicationTab({ caseData, caseId }: { caseData: CaseDetail; caseId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingDocuments, setRequestingDocuments] = useState(false);
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/communications?applicationId=${caseId}&organizationId=${caseData.program.organizationId}`
        );
        if (!response.ok) throw new Error("Failed to load messages");
        
        const result = await response.json();
        console.log("[Frontend] API response:", result);
        
        // API returns { success: true, data: { timeline: [...], ... } }
        const conversation = result.data || result;
        const timeline = conversation.timeline || [];
        
        // Filter only message-type items from timeline
        const messageItems = timeline.filter((item: any) => item.type === "message");
        console.log("[Frontend] Messages extracted:", messageItems.length);
        
        setMessages(messageItems);
        
        // Mark as read
        await fetch("/api/communications/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: caseId,
            organizationId: caseData.program.organizationId,
            action: "mark_read",
          }),
        });
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [caseId, caseData.program.organizationId]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await fetch("/api/communications/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: caseId,
          organizationId: caseData.program.organizationId,
          content: messageText,
        }),
      });

      const result = await response.json();
      console.log("[Frontend] Send message response:", result);
      
      if (!response.ok) {
        console.error("Failed to send message:", result);
        throw new Error(result.message || result.error || "Failed to send message");
      }

      // API returns { success: true, data: { id, senderId, sender: {...}, content, ... } }
      const messageData = result.data;
      
      // Success - add message to UI
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: messageData.id,
          type: "message",
          senderId: messageData.senderId,
          senderName: messageData.sender?.name || messageData.sender?.email || "You",
          senderRole: messageData.senderRole || "staff",
          content: messageData.content,
          read: messageData.read || false,
          createdAt: messageData.createdAt,
          timestamp: messageData.createdAt,
        },
      ]);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  const handleRequestDocuments = async () => {
    if (selectedDocumentTypes.length === 0) return;

    try {
      setRequestingDocuments(true);
      const payload = {
        applicationId: caseId,
        organizationId: caseData.program.organizationId,
        documentTypes: selectedDocumentTypes,
        messageContent: messageText.trim() || `Please submit the requested documents: ${selectedDocumentTypes.join(", ")}`,
      };
      const response = await fetch("/api/communications/document-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to request documents");

      const result = await response.json();
      console.log("[Frontend] Document request response:", result);
      
      // API returns { success: true, data: { message: {...}, documentRequests: [...] } }
      if (result.data?.message) {
        const msg = result.data.message;
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: msg.id,
            type: "message",
            senderId: msg.senderId,
            senderName: msg.sender?.name || msg.sender?.email || "Staff",
            senderRole: "staff",
            content: msg.content,
            read: msg.read,
            createdAt: msg.createdAt,
            timestamp: msg.createdAt,
          },
        ]);
      }
      setMessageText("");
      setSelectedDocumentTypes([]);
    } catch (error) {
      console.error("Error requesting documents:", error);
      alert(`Failed to request documents: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setRequestingDocuments(false);
    }
  };

  const documentOptions = [
    "identity_proof",
    "income_verification",
    "employment_proof",
    "residency_proof",
  ];

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "Just now";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Just now";
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-500">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-50 rounded-xl border border-border">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === "staff" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-xl px-4 py-3 ${
                  msg.senderRole === "staff"
                    ? "bg-brand text-white"
                    : "bg-white border border-border text-slate-950"
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${msg.senderRole === "staff" ? "text-brand-light opacity-75" : "text-slate-500"}`}>
                  {msg.senderName}
                </p>
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.senderRole === "staff" ? "text-brand-light opacity-50" : "text-slate-400"
                  }`}
                >
                  {formatTimestamp(msg.createdAt || msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-white rounded-b-xl">
        <div className="mb-3 flex flex-wrap gap-2">
          {documentOptions.map((option) => {
            const selected = selectedDocumentTypes.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setSelectedDocumentTypes((current) =>
                    current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
                  )
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selected ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {option.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
          <button
            onClick={handleRequestDocuments}
            disabled={selectedDocumentTypes.length === 0 || requestingDocuments}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {requestingDocuments ? "Requesting..." : "Request Docs"}
          </button>
        </div>
      </div>
    </div>
  );
}
