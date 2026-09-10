"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { CaseDetail } from "@/lib/cases/case-service";

// Import new review components
import { ApplicantSummaryCard } from "@/components/reviews/applicant-summary-card";
import { EligibilitySummary } from "@/components/reviews/eligibility-summary";
import { ReviewChecklist } from "@/components/reviews/review-checklist";
import { DocumentsPanel } from "@/components/reviews/documents-panel";
import { ApplicationSummary } from "@/components/reviews/application-summary";
import { CaseInfoSidebar } from "@/components/reviews/case-info-sidebar";
import { CaseActionPanel } from "@/components/reviews/case-action-panel";
import { CommunicationCenter } from "@/components/case-communication/communication-center";

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

export default function CaseDetailPageEnhanced() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; organizationId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"review" | "communication" | "documents" | "timeline">("review");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({ id: userData.id, organizationId: userData.organizationId });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

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

  const handleAction = async (action: string) => {
    switch (action) {
      case "refresh":
        await refreshCase();
        break;
      case "communicate":
        setActiveView("communication");
        break;
      case "documents":
        setActiveView("documents");
        break;
      case "timeline":
        setActiveView("timeline");
        break;
      case "assign":
        // TODO: Open assign modal
        console.log("Assign action");
        break;
      case "begin_review":
        setActiveView("review");
        break;
      case "note":
        // TODO: Open note modal
        console.log("Note action");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-[1600px] mx-auto">
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
        <div className="max-w-[1600px] mx-auto">
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

  const missingDocumentsCount = caseData.documentRequests.filter((d) => d.status === "pending").length;
  
  // Calculate time in queue
  const timeInQueue = caseData.submittedAt
    ? Math.floor((Date.now() - new Date(caseData.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Mock SLA (30 days)
  const slaRemaining = 30 - timeInQueue;

  const priority: "high" | "medium" | "low" =
    caseData.status === "pending" ? "high" : caseData.status === "waitlisted" ? "low" : "medium";

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky Header */}
      <div className="border-b border-border bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/applications">
                <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-950">
                  {caseData.applicant.name || "Unknown Applicant"}
                </h1>
                <p className="text-sm text-slate-500">
                  {caseData.program.name} • Submitted{" "}
                  {caseData.submittedAt ? new Date(caseData.submittedAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  statusStyles[caseData.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabels[caseData.status] || caseData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Desktop: 3-column | Tablet: 2-column | Mobile: Stacked */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-[300px_1fr_320px] px-6 py-6 w-full mx-auto">
          {/* LEFT SIDEBAR - Applicant Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <ApplicantSummaryCard
              applicant={caseData.applicant}
              metadata={{
                householdSize: caseData.metadata?.householdSize,
                income: caseData.metadata?.income,
                veteranStatus: caseData.metadata?.veteranStatus,
                disabilityStatus: caseData.metadata?.disabilityStatus,
                publicWorkerStatus: caseData.metadata?.publicWorkerStatus,
                citizenship: (caseData.applicationData as any).citizenship,
                phone: (caseData.applicationData as any).phone,
                preferredLanguage: (caseData.applicationData as any).preferredLanguage,
                currentHousingStatus: (caseData.applicationData as any).currentHousingStatus,
              }}
              programName={caseData.program.name}
              submittedAt={caseData.submittedAt}
              status={caseData.status}
              assignedTo={caseData.assignedTo}
              matchScore={caseData.matchScore}
            />
          </div>

          {/* CENTER - Main Review Area */}
          <div className="space-y-6">
            {/* View Selector */}
            <div className="rounded-[28px] border border-border bg-white p-2 shadow-soft">
              <div className="overflow-x-auto scrollbar-thin">
                <div className="flex gap-2 flex-nowrap">
                  {[
                    { id: "review", label: "Review Workspace" },
                    { id: "communication", label: "Communication" },
                    { id: "documents", label: "Documents" },
                    { id: "timeline", label: "Timeline" },
                  ].map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id as any)}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                        activeView === view.id
                          ? "bg-brand text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content based on active view */}
            {activeView === "review" && (
              <div className="space-y-6">
                {/* Eligibility Summary */}
                <EligibilitySummary
                  eligibility={caseData.eligibility}
                  matchScore={caseData.matchScore}
                  programName={caseData.program.name}
                  metadata={{
                    recommendationTier: caseData.matchScore && caseData.matchScore >= 80 ? "high" : "medium",
                  }}
                />

                {/* Review Checklist */}
                {currentUser && (
                  <ReviewChecklist
                    applicationId={caseData.id}
                    organizationId={caseData.program.organizationId}
                    userId={currentUser.id}
                  />
                )}

                {/* Application Summary */}
                <ApplicationSummary applicationData={caseData.applicationData} />
              </div>
            )}

            {activeView === "communication" && currentUser && (
              <div className="h-[800px]">
                <CommunicationCenter
                  applicationId={caseData.id}
                  organizationId={caseData.program.organizationId}
                  userRole="staff"
                  userId={currentUser.id}
                />
              </div>
            )}

            {activeView === "documents" && (
              <DocumentsPanel documents={caseData.documentRequests} />
            )}

            {activeView === "timeline" && (
              <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
                <h3 className="text-lg font-bold text-slate-950 mb-6">Case Timeline</h3>
                <div className="space-y-4">
                  {caseData.events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand">{index + 1}</span>
                        </div>
                        {index < caseData.events.length - 1 && (
                          <div className="h-full w-0.5 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-semibold text-slate-950">{event.description}</p>
                        {event.actor && (
                          <p className="text-xs text-slate-600 mt-1">{event.actor.name || "Unknown"}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Case Info & Actions */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            <CaseActionPanel
              caseId={caseData.id}
              onAction={handleAction}
              missingDocumentsCount={missingDocumentsCount}
            />

            <CaseInfoSidebar
              caseId={caseData.id}
              applicationNumber={`CASE-${caseData.id.slice(0, 8).toUpperCase()}`}
              programName={caseData.program.name}
              organizationName={caseData.program.organizationId}
              createdDate={caseData.submittedAt}
              lastUpdated={caseData.lastActivityAt}
              currentStage={caseData.status}
              assignedReviewer={caseData.assignedTo}
              priority={priority}
              flags={[]}
              timeInQueue={timeInQueue}
              slaRemaining={slaRemaining}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
