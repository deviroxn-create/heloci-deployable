"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface DocumentRequest {
  id: string;
  documentType: string;
  status: string;
  fileUrl: string | null;
  requestedAt: string;
  submittedAt: string | null;
  notes?: string | null;
}

interface AppWithDocs {
  id: string;
  status: string;
  program: { name: string; slug: string };
  documentRequests: DocumentRequest[];
}

/* ─── Status config ──────────────────────────────────────────── */
const DOC_STATUS: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  pending:      { label: "Required",     badge: "bg-amber-50 text-amber-700 border-amber-200",   icon: AlertTriangle },
  uploaded:     { label: "Uploaded",     badge: "bg-blue-50 text-blue-700 border-blue-200",      icon: UploadCloud },
  under_review: { label: "Under review", badge: "bg-slate-100 text-slate-700 border-slate-200",  icon: Clock },
  accepted:     { label: "Accepted",     badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected:     { label: "Rejected",     badge: "bg-red-50 text-red-700 border-red-200",         icon: AlertTriangle },
};

function docStatus(status: string) {
  return DOC_STATUS[status.toLowerCase()] ?? DOC_STATUS.pending;
}

/* ─── Upload handler ─────────────────────────────────────────── */
async function uploadDocument(docId: string, _file: File): Promise<void> {
  // Placeholder — wire to Cloudinary or your storage in production.
  // For now this updates the UI state optimistically.
  await new Promise((resolve) => setTimeout(resolve, 600));
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [apps, setApps] = useState<AppWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetch("/api/applications/my")
      .then((r) => r.json())
      .then((d: { applications?: AppWithDocs[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        // Only apps that have at least one document request
        const withDocs = (d.applications ?? []).filter(
          (a) => a.documentRequests.length > 0
        );
        setApps(withDocs);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(docId: string, file: File) {
    setUploading((prev) => ({ ...prev, [docId]: true }));
    try {
      await uploadDocument(docId, file);
      // Optimistically flip status to "uploaded"
      setApps((prev) =>
        prev.map((app) => ({
          ...app,
          documentRequests: app.documentRequests.map((d) =>
            d.id === docId ? { ...d, status: "uploaded", submittedAt: new Date().toISOString() } : d
          ),
        }))
      );
    } finally {
      setUploading((prev) => ({ ...prev, [docId]: false }));
    }
  }

  const allDocs = apps.flatMap((app) =>
    app.documentRequests.map((doc) => ({ ...doc, appName: app.program.name, appSlug: app.program.slug }))
  );

  const pendingCount = allDocs.filter((d) => d.status === "pending").length;
  const acceptedCount = allDocs.filter((d) => d.status === "accepted").length;

  return (
    <ApplicantShell
      title="Documents"
      description="Upload required documents to keep your applications moving. Staff reviews uploads within 24 hours."
    >
      <div className="space-y-8">
        {/* Summary stats */}
        {!loading && allDocs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total documents", value: allDocs.length, color: "text-slate-900" },
              { label: "Still needed", value: pendingCount, color: "text-amber-700" },
              { label: "Accepted", value: acceptedCount, color: "text-emerald-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={cn("mt-2 text-3xl font-bold", color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#006AFF]" />
            <span className="text-sm text-slate-600">Loading documents…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && allDocs.length === 0 && (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No documents requested yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Document requests appear here after you submit an application.
            </p>
          </div>
        )}

        {/* Documents grouped by application */}
        {!loading && !error && apps.map((app) => (
          <section key={app.id} className="rounded-[32px] border border-border bg-white p-8 shadow-soft">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#006AFF]">
                {app.program.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">Application status: {app.status}</p>
            </div>

            <div className="space-y-3">
              {app.documentRequests.map((doc) => {
                const s = docStatus(doc.status);
                const Icon = s.icon;
                const isUploading = uploading[doc.id];

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{doc.documentType}</p>
                        {doc.notes && (
                          <p className="mt-0.5 text-xs text-slate-500">{doc.notes}</p>
                        )}
                        {doc.submittedAt && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Uploaded {new Date(doc.submittedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.badge)}>
                        <Icon className="h-3 w-3" />
                        {s.label}
                      </span>

                      {doc.status !== "accepted" && (
                        <label className={cn(
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition",
                          isUploading ? "bg-slate-400 cursor-wait" : "bg-[#006AFF] hover:bg-[#0057e6]"
                        )}>
                          {isUploading ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                          ) : (
                            <><UploadCloud className="h-3.5 w-3.5" /> Upload</>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.docx"
                            className="sr-only"
                            disabled={isUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleUpload(doc.id, file);
                            }}
                          />
                        </label>
                      )}

                      {doc.fileUrl && doc.status === "accepted" && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#006AFF] hover:underline">
                          View file
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Info panel */}
        <section className="rounded-[32px] bg-slate-50 p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#006AFF]">
            How document upload works
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Accepted formats</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                PDF, JPG, PNG, DOCX — maximum 12 MB per file.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">Review timeline</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Staff review uploads within 24 hours and send follow-up requests directly to your inbox.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ApplicantShell>
  );
}
