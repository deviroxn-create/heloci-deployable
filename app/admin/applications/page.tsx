"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Filter, Eye, MessageSquare, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

interface Case {
  id: string;
  caseId: string;
  applicantName: string;
  applicantEmail: string;
  programName: string;
  status: string;
  matchScore: number | null;
  priority: "high" | "medium" | "low";
  assignedTo: { id: string; name: string | null } | null;
  submittedAt: Date | null;
  lastActivityAt: Date;
  missingDocuments: number;
  totalDocumentsRequested: number;
}

interface CaseListResult {
  cases: Case[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  under_review: "bg-brand/10 text-brand",
  approved: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  waitlisted: "bg-slate-100 text-slate-700"
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

const tabs = ["All", "Pending", "Under Review", "Approved", "Rejected", "Waitlisted"];

export default function AdminApplicationsPage() {
  const [data, setData] = useState<CaseListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: "25"
        });

        if (selectedStatus && selectedStatus !== "All") {
          params.append("status", selectedStatus.toLowerCase());
        }

        if (searchTerm) {
          params.append("search", searchTerm);
        }

        const response = await fetch(`/api/cases?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cases");
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [currentPage, selectedStatus, searchTerm]);

  const summaryStats = data
    ? {
        Total: data.total,
        Pending: data.cases.filter((c) => c.status === "pending").length,
        "Under Review": data.cases.filter((c) => c.status === "under_review").length,
        Approved: data.cases.filter((c) => c.status === "approved").length,
        Rejected: data.cases.filter((c) => c.status === "rejected").length
      }
    : { Total: 0, Pending: 0, "Under Review": 0, Approved: 0, Rejected: 0 };

  return (
    <AdminShell
      title="Case Queue"
      description="Review, filter, and take action on all housing applications."
      actions={
        <Button size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      }
    >
      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-5">
        {Object.entries(summaryStats).map(([label, value]) => (
          <div key={label} className="rounded-[24px] border border-border bg-white px-5 py-4 shadow-soft text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="rounded-[28px] border border-border bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="search"
              placeholder="Search by name, ID, or program…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Search applications"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setSelectedStatus(tab);
                setCurrentPage(1);
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                (selectedStatus === tab || (!selectedStatus && tab === "All"))
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Loading/Error State */}
      {error ? (
        <div className="rounded-[28px] border border-error/20 bg-error/5 p-6 text-center">
          <p className="text-error font-semibold">Error loading cases: {error}</p>
        </div>
      ) : loading ? (
        <div className="rounded-[28px] border border-border bg-white shadow-soft p-12 text-center">
          <p className="text-slate-500">Loading cases...</p>
        </div>
      ) : !data?.cases.length ? (
        <div className="rounded-[28px] border border-border bg-white shadow-soft p-12 text-center">
          <p className="text-slate-500">No cases found</p>
        </div>
      ) : (
        <>
          <div className="rounded-[28px] border border-border bg-white shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sticky left-0 z-10 bg-slate-50">Applicant</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Program</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assigned To</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Match Score</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Docs</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.cases.map((caseItem) => (
                    <tr key={caseItem.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4 sticky left-0 z-10 bg-white hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                            {caseItem.applicantName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{caseItem.applicantName}</p>
                            <p className="text-xs text-slate-500">{caseItem.caseId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{caseItem.programName}</td>
                      <td className="px-5 py-4 text-slate-700 text-xs">
                        {caseItem.assignedTo ? caseItem.assignedTo.name || "Assigned" : "-"}
                      </td>
                      <td className="px-5 py-4">
                        {caseItem.matchScore ? (
                          <span className="text-sm font-semibold text-brand">{caseItem.matchScore}%</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {caseItem.submittedAt ? new Date(caseItem.submittedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusStyles[caseItem.status] || "bg-slate-100 text-slate-700"}`}>
                          {statusLabels[caseItem.status] || caseItem.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {caseItem.missingDocuments > 0 ? (
                          <span className="text-xs font-semibold text-warning">
                            {caseItem.missingDocuments}/{caseItem.totalDocumentsRequested}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/admin/cases/${caseItem.id}`}>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand shrink-0"
                              aria-label={`View ${caseItem.applicantName}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/admin/cases/${caseItem.id}?tab=communication`}>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand shrink-0"
                              aria-label={`Message ${caseItem.applicantName}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-slate-500">
              <p>
                Showing {(currentPage - 1) * data.pageSize + 1} to {Math.min(currentPage * data.pageSize, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs">
                  {currentPage} / {data.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
                  disabled={currentPage >= data.totalPages}
                  className="rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
