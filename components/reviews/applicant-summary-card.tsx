"use client";

import { User, Mail, Phone, Home, DollarSign, Users, CheckCircle2, AlertTriangle, Shield } from "lucide-react";

interface ApplicantSummaryCardProps {
  applicant: {
    id: string;
    name: string | null;
    email: string;
    photo?: string;
  };
  metadata: {
    householdSize?: number;
    income?: number;
    veteranStatus?: boolean;
    disabilityStatus?: boolean;
    publicWorkerStatus?: boolean;
    citizenship?: string;
    phone?: string;
    preferredLanguage?: string;
    currentHousingStatus?: string;
  };
  programName: string;
  submittedAt: Date | null;
  status: string;
  assignedTo: { id: string; name: string | null; email: string } | null;
  matchScore: number | null;
}

export function ApplicantSummaryCard({
  applicant,
  metadata,
  programName,
  submittedAt,
  status,
  assignedTo,
  matchScore,
}: ApplicantSummaryCardProps) {
  const initials = applicant.name
    ? applicant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : applicant.email[0].toUpperCase();

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft h-fit sticky top-20 space-y-6">
      {/* Avatar & Name */}
      <div className="text-center">
        {applicant.photo ? (
          <img
            src={applicant.photo}
            alt={applicant.name || "Applicant"}
            className="h-20 w-20 rounded-2xl mx-auto mb-3 object-cover"
          />
        ) : (
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand/70 text-2xl font-bold text-white mb-3">
            {initials}
          </div>
        )}
        <h2 className="text-xl font-bold text-slate-950">{applicant.name || "Unknown Applicant"}</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">{applicant.id.slice(0, 12)}</p>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-start gap-3">
          <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
            <p className="text-sm text-slate-950 truncate mt-0.5">{applicant.email}</p>
          </div>
        </div>

        {metadata.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Phone</p>
              <p className="text-sm text-slate-950 mt-0.5">{metadata.phone}</p>
            </div>
          </div>
        )}

        {metadata.preferredLanguage && (
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Preferred Language</p>
              <p className="text-sm text-slate-950 mt-0.5">{metadata.preferredLanguage}</p>
            </div>
          </div>
        )}

        {metadata.citizenship && (
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500">Citizenship</p>
              <p className="text-sm text-slate-950 mt-0.5">{metadata.citizenship}</p>
            </div>
          </div>
        )}
      </div>

      {/* Housing & Household */}
      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-brand" />
            <p className="text-xs font-semibold uppercase text-slate-500">Household</p>
          </div>
          <p className="text-2xl font-bold text-slate-950">{metadata.householdSize || "—"}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-brand" />
            <p className="text-xs font-semibold uppercase text-slate-500">Income</p>
          </div>
          <p className="text-2xl font-bold text-slate-950">
            {metadata.income ? `$${(metadata.income / 1000).toFixed(0)}k` : "—"}
          </p>
        </div>
      </div>

      {/* Current Housing Status */}
      {metadata.currentHousingStatus && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-semibold uppercase text-slate-500">Current Housing</p>
          </div>
          <p className="text-sm text-slate-700">{metadata.currentHousingStatus}</p>
        </div>
      )}

      {/* Match Score */}
      {matchScore !== null && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Match Score</p>
          <div className="relative">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  matchScore >= 80
                    ? "bg-gradient-to-r from-success to-success/80"
                    : matchScore >= 60
                      ? "bg-gradient-to-r from-warning to-warning/80"
                      : "bg-gradient-to-r from-error to-error/80"
                }`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-brand mt-2">{matchScore}%</p>
          </div>
        </div>
      )}

      {/* Status Badges */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Qualifications</p>
        {metadata.veteranStatus && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
            <p className="text-sm font-medium text-slate-950">Veteran</p>
          </div>
        )}
        {metadata.disabilityStatus && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm font-medium text-slate-950">Disability</p>
          </div>
        )}
        {metadata.publicWorkerStatus && (
          <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
            <p className="text-sm font-medium text-slate-950">Public Worker</p>
          </div>
        )}
      </div>

      {/* Program & Submission */}
      <div className="border-t border-border pt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Program</p>
          <p className="text-sm font-medium text-slate-950">{programName}</p>
        </div>
        {submittedAt && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Submitted</p>
            <p className="text-sm text-slate-700">{new Date(submittedAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Assigned Reviewer */}
      {assignedTo && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Assigned Reviewer</p>
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand/5 to-brand/10 p-3 border border-brand/20">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand flex-shrink-0">
              {assignedTo.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950 truncate">{assignedTo.name || "Unknown"}</p>
              <p className="text-xs text-slate-600 truncate">{assignedTo.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
