"use client";

import { FileText, Download, Eye, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DocumentRequest {
  id: string;
  documentType: string;
  status: "pending" | "submitted" | "reviewed";
  requestedAt: Date;
  submittedAt: Date | null;
  expiresAt: Date | null;
  fileUrl: string | null;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    uploadedBy?: string;
    verificationStatus?: "approved" | "rejected" | "pending";
    verificationNotes?: string;
  };
}

interface DocumentsPanelProps {
  documents: DocumentRequest[];
  onDocumentAction?: (documentId: string, action: "view" | "download" | "verify") => void;
}

export function DocumentsPanel({ documents, onDocumentAction }: DocumentsPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reviewed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "submitted":
        return <Clock className="h-5 w-5 text-warning" />;
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-error" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reviewed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Reviewed
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-brand/10 text-brand border-brand/20">
            Submitted
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-error/10 text-error border-error/20">
            Pending
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const submittedCount = documents.filter((d) => d.status === "submitted").length;
  const reviewedCount = documents.filter((d) => d.status === "reviewed").length;

  return (
    <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Uploaded Documents</h3>
          <p className="text-sm text-slate-500 mt-1">
            {reviewedCount} reviewed • {submittedCount} awaiting review • {pendingCount} missing
          </p>
        </div>
        {documents.length > 0 && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No documents requested yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const isExpiringSoon =
              doc.expiresAt && new Date(doc.expiresAt).getTime() - Date.now() < 48 * 60 * 60 * 1000;

            return (
              <div
                key={doc.id}
                className={`rounded-xl border p-4 transition-all ${
                  doc.status === "pending"
                    ? "bg-error/5 border-error/20"
                    : doc.status === "submitted"
                      ? "bg-brand/5 border-brand/20"
                      : "bg-success/5 border-success/20"
                } hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">{getStatusIcon(doc.status)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Document Type & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {formatDocumentType(doc.documentType)}
                        </p>
                        {doc.metadata?.fileName && (
                          <p className="text-xs text-slate-500 mt-0.5">{doc.metadata.fileName}</p>
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="font-medium">Requested:</span>{" "}
                        {new Date(doc.requestedAt).toLocaleDateString()}
                      </div>
                      {doc.submittedAt && (
                        <div>
                          <span className="font-medium">Submitted:</span>{" "}
                          {new Date(doc.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                      {doc.metadata?.fileSize && (
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(doc.metadata.fileSize)}
                        </div>
                      )}
                      {doc.metadata?.uploadedBy && (
                        <div>
                          <span className="font-medium">Uploaded by:</span> {doc.metadata.uploadedBy}
                        </div>
                      )}
                    </div>

                    {/* Expiry Warning */}
                    {doc.expiresAt && doc.status === "pending" && (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                          isExpiringSoon ? "bg-error/10 border border-error/20" : "bg-warning/10 border border-warning/20"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 ${isExpiringSoon ? "text-error" : "text-warning"}`}
                        />
                        <p className={`text-xs font-medium ${isExpiringSoon ? "text-error" : "text-warning"}`}>
                          {isExpiringSoon ? "Expires soon" : "Expires"}: {new Date(doc.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Verification Status */}
                    {doc.metadata?.verificationStatus && doc.status === "reviewed" && (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                          doc.metadata.verificationStatus === "approved"
                            ? "bg-success/10 border border-success/20"
                            : doc.metadata.verificationStatus === "rejected"
                              ? "bg-error/10 border border-error/20"
                              : "bg-slate-50 border border-border"
                        }`}
                      >
                        {doc.metadata.verificationStatus === "approved" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : doc.metadata.verificationStatus === "rejected" ? (
                          <XCircle className="h-4 w-4 text-error" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-400" />
                        )}
                        <p className="text-xs font-medium text-slate-700 capitalize">
                          {doc.metadata.verificationStatus}
                        </p>
                      </div>
                    )}

                    {/* Verification Notes */}
                    {doc.metadata?.verificationNotes && (
                      <div className="rounded-lg bg-slate-50 border border-border p-2">
                        <p className="text-xs text-slate-700">{doc.metadata.verificationNotes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {doc.fileUrl && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDocumentAction?.(doc.id, "view")}
                        >
                          <Eye className="h-3 w-3 mr-1.5" />
                          Quick View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDocumentAction?.(doc.id, "download")}
                        >
                          <Download className="h-3 w-3 mr-1.5" />
                          Download
                        </Button>
                        {doc.status === "submitted" && (
                          <Button
                            size="sm"
                            className="bg-brand hover:bg-brand/90"
                            onClick={() => onDocumentAction?.(doc.id, "verify")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Verify
                          </Button>
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium border border-border hover:bg-slate-50 transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
