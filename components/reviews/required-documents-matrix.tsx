"use client";

import { CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocumentVerification {
  id: string | null;
  status: "pending" | "verified" | "rejected" | "needs_replacement";
  reviewedBy: string | null;
  reviewedByUser: { id: string; name: string | null } | null;
  reviewedAt: Date | null;
  notes: string | null;
  rejectionReason: string | null;
}

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: { id: string; name: string | null; email: string };
  verification: DocumentVerification | null;
  size?: number;
}

interface RequiredDocumentsMatrixProps {
  requiredDocuments: string[];
  uploadedDocuments: UploadedDocument[];
  onRequestDocument?: (docType: string) => void;
  onSelectDocument?: (document: UploadedDocument) => void;
}

export function RequiredDocumentsMatrix({
  requiredDocuments,
  uploadedDocuments,
  onRequestDocument,
  onSelectDocument
}: RequiredDocumentsMatrixProps) {
  
  const getDocumentStatus = (docType: string) => {
    const uploaded = uploadedDocuments.find(d => d.type === docType);
    
    if (!uploaded) {
      return { 
        status: "missing", 
        icon: AlertCircle, 
        color: "error", 
        label: "Missing",
        document: null
      };
    }
    
    if (!uploaded.verification) {
      return { 
        status: "pending", 
        icon: Clock, 
        color: "warning", 
        label: "Pending Review",
        document: uploaded
      };
    }

    switch (uploaded.verification.status) {
      case "verified":
        return { status: "approved", icon: CheckCircle2, color: "success", label: "Approved", document: uploaded };
      case "pending":
        return { status: "pending", icon: Clock, color: "warning", label: "Pending Review", document: uploaded };
      case "rejected":
        return { status: "rejected", icon: XCircle, color: "error", label: "Rejected", document: uploaded };
      case "needs_replacement":
        return { status: "replacement", icon: RefreshCw, color: "warning", label: "Replacement Requested", document: uploaded };
      default:
        return { status: "unknown", icon: AlertCircle, color: "slate", label: "Unknown", document: uploaded };
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const stats = {
    total: requiredDocuments.length,
    approved: 0,
    pending: 0,
    missing: 0,
    needsAction: 0
  };

  requiredDocuments.forEach(docType => {
    const { status } = getDocumentStatus(docType);
    if (status === "approved") stats.approved++;
    else if (status === "pending") stats.pending++;
    else if (status === "missing") stats.missing++;
    else if (status === "rejected" || status === "replacement") stats.needsAction++;
  });

  const completionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <Card className="rounded-[28px] border border-border bg-white p-6 shadow-soft space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-950">Required Documents</h3>
        <p className="text-sm text-slate-500 mt-1">
          {stats.approved} of {stats.total} approved • {stats.missing} missing • {stats.needsAction} need action
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Completion</span>
          <span className="font-bold text-brand">{completionRate}%</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Document Matrix */}
      {requiredDocuments.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No required documents defined for this program</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requiredDocuments.map((docType) => {
            const { status, icon: Icon, color, label, document } = getDocumentStatus(docType);
            
            return (
              <div
                key={docType}
                className={`rounded-xl border p-4 transition cursor-pointer hover:shadow-md ${
                  status === "approved"
                    ? "bg-success/5 border-success/20"
                    : status === "missing"
                      ? "bg-error/5 border-error/20"
                      : status === "replacement" || status === "rejected"
                        ? "bg-warning/5 border-warning/20"
                        : "bg-slate-50 border-border"
                }`}
                onClick={() => document && onSelectDocument?.(document)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={`h-5 w-5 flex-shrink-0 text-${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-950 truncate">
                        {formatDocumentType(docType)}
                      </p>
                      {document && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                          {document.verification?.reviewedByUser && (
                            <> • Reviewed by {document.verification.reviewedByUser.name}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`bg-${color}/10 text-${color} border-${color}/20`}>
                      {label}
                    </Badge>
                    {!document && onRequestDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDocument(docType);
                        }}
                      >
                        Request
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
