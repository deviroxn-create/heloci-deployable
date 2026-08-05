"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Download, Eye, X, ZoomIn, ZoomOut,
  CheckCircle2, XCircle, RefreshCw, Clock, User,
  Calendar, FileIcon, AlertCircle, MessageSquare, Loader2,
  Send, Shield, Building2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DocumentVerification {
  id: string | null;
  status: "pending" | "verified" | "rejected" | "needs_replacement";
  reviewedBy: string | null;
  reviewedByUser: { id: string; name: string | null } | null;
  reviewedAt: Date | null;
  notes: string | null;
  rejectionReason: string | null;
}

interface DocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  verification: DocumentVerification | null;
  size?: number;
}

interface DocumentDetailsPanelProps {
  document: DocumentItem | null;
  onClose: () => void;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string, notes?: string) => Promise<void>;
  onRequestReplacement: (reason: string, deadline?: string, instructions?: string) => Promise<void>;
  onMarkPending: () => Promise<void>;
  onAddNote: (note: string, isInternal: boolean) => Promise<void>;
  loading?: boolean;
}

export function DocumentDetailsPanel({
  document,
  onClose,
  onApprove,
  onReject,
  onRequestReplacement,
  onMarkPending,
  onAddNote,
  loading = false
}: DocumentDetailsPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [showPreview, setShowPreview] = useState(true);
  const [internalNote, setInternalNote] = useState("");
  const [applicantNote, setApplicantNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [replaceReason, setReplaceReason] = useState("");
  const [replaceDeadline, setReplaceDeadline] = useState("");
  const [replaceInstructions, setReplaceInstructions] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Applicant note sending state
  const [sendingNote, setSendingNote] = useState(false);

  // Download history state
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [downloadHistoryLoading, setDownloadHistoryLoading] = useState(false);

  // Downloading state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Load history when document changes
  useEffect(() => {
    if (!document?.id) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const response = await fetch(`/api/documents/${document.id}/history`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load history");
        }
        const data = await response.json();
        setHistory(data.history || []);
      } catch (error: any) {
        console.error("Error loading history:", error);
        setHistoryError(error.message);
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [document?.id]);

  // Load download history when document changes
  useEffect(() => {
    if (!document?.id) {
      setDownloadHistory([]);
      return;
    }

    const fetchDownloadHistory = async () => {
      try {
        setDownloadHistoryLoading(true);
        const response = await fetch(`/api/documents/${document.id}/access-history`);
        if (!response.ok) {
          throw new Error("Failed to load download history");
        }
        const data = await response.json();
        setDownloadHistory(data.history || []);
      } catch (error: any) {
        console.error("Error loading download history:", error);
        setDownloadHistory([]);
      } finally {
        setDownloadHistoryLoading(false);
      }
    };

    fetchDownloadHistory();
  }, [document?.id]);

  if (!document) {
    return (
      <Card className="rounded-[28px] border border-border bg-white p-8 shadow-soft h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-950 mb-2">
            No Document Selected
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Select a document from the list to view details and perform review actions
          </p>
        </div>
      </Card>
    );
  }

  const fileExtension = document.fileName.split(".").pop()?.toLowerCase();
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExtension || "");
  const isPDF = fileExtension === "pdf";
  const canPreview = isImage || isPDF;

  const getStatusInfo = (verification: DocumentVerification | null) => {
    if (!verification) {
      return { 
        icon: Clock, 
        color: "warning", 
        label: "Pending Review",
        bgColor: "bg-warning/10",
        textColor: "text-warning"
      };
    }

    switch (verification.status) {
      case "verified":
        return { 
          icon: CheckCircle2, 
          color: "success", 
          label: "Approved",
          bgColor: "bg-success/10",
          textColor: "text-success"
        };
      case "rejected":
        return { 
          icon: XCircle, 
          color: "error", 
          label: "Rejected",
          bgColor: "bg-error/10",
          textColor: "text-error"
        };
      case "needs_replacement":
        return { 
          icon: RefreshCw, 
          color: "warning", 
          label: "Replacement Requested",
          bgColor: "bg-warning/10",
          textColor: "text-warning"
        };
      default:
        return { 
          icon: Clock, 
          color: "slate", 
          label: "Pending",
          bgColor: "bg-slate-100",
          textColor: "text-slate-600"
        };
    }
  };

  const statusInfo = getStatusInfo(document.verification);
  const StatusIcon = statusInfo.icon;

  const handleApprove = async () => {
    if (loading) return;
    await onApprove(internalNote || undefined);
    setInternalNote("");
    setActiveAction(null);
  };

  const handleReject = async () => {
    if (loading || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    await onReject(rejectReason, internalNote || undefined);
    setRejectReason("");
    setInternalNote("");
    setActiveAction(null);
  };

  const handleRequestReplacement = async () => {
    if (loading || !replaceReason.trim()) {
      alert("Please provide a reason for replacement");
      return;
    }
    await onRequestReplacement(
      replaceReason,
      replaceDeadline || undefined,
      replaceInstructions || undefined
    );
    setReplaceReason("");
    setReplaceDeadline("");
    setReplaceInstructions("");
    setActiveAction(null);
  };

  const handleAddInternalNote = async () => {
    if (loading || !internalNote.trim()) return;
    await onAddNote(internalNote, true);
    setInternalNote("");
  };

  const handleAddApplicantNote = async () => {
    if (loading || sendingNote || !applicantNote.trim() || !document?.id) return;
    
    try {
      setSendingNote(true);
      const response = await fetch(`/api/documents/${document.id}/send-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: applicantNote, isInternal: false })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send note");
      }

      setApplicantNote("");
      
      // Refresh history to show the new note
      const historyResponse = await fetch(`/api/documents/${document.id}/history`);
      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setHistory(data.history || []);
      }
    } catch (error: any) {
      console.error("Error sending applicant note:", error);
      alert(`Failed to send note: ${error.message}`);
    } finally {
      setSendingNote(false);
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getActionInfo = (type: string) => {
    const typeMap: Record<string, {
      icon: any;
      label: string;
      bgColor: string;
      textColor: string;
      badgeBg: string;
      badgeText: string;
    }> = {
      document_uploaded: {
        icon: FileText,
        label: "Uploaded",
        bgColor: "bg-slate-100",
        textColor: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700"
      },
      document_approved: {
        icon: CheckCircle2,
        label: "Approved",
        bgColor: "bg-success/10",
        textColor: "text-success",
        badgeBg: "bg-success/10",
        badgeText: "text-success"
      },
      approved: {
        icon: CheckCircle2,
        label: "Approved",
        bgColor: "bg-success/10",
        textColor: "text-success",
        badgeBg: "bg-success/10",
        badgeText: "text-success"
      },
      document_rejected: {
        icon: XCircle,
        label: "Rejected",
        bgColor: "bg-error/10",
        textColor: "text-error",
        badgeBg: "bg-error/10",
        badgeText: "text-error"
      },
      rejected: {
        icon: XCircle,
        label: "Rejected",
        bgColor: "bg-error/10",
        textColor: "text-error",
        badgeBg: "bg-error/10",
        badgeText: "text-error"
      },
      document_replacement_requested: {
        icon: RefreshCw,
        label: "Replacement",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        badgeBg: "bg-warning/10",
        badgeText: "text-warning"
      },
      replacement_requested: {
        icon: RefreshCw,
        label: "Replacement",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        badgeBg: "bg-warning/10",
        badgeText: "text-warning"
      },
      staff_note_sent: {
        icon: Send,
        label: "Note Sent",
        bgColor: "bg-info/10",
        textColor: "text-info",
        badgeBg: "bg-info/10",
        badgeText: "text-info"
      },
      note_added: {
        icon: MessageSquare,
        label: "Note Added",
        bgColor: "bg-slate-100",
        textColor: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700"
      },
      marked_pending: {
        icon: Clock,
        label: "Pending",
        bgColor: "bg-slate-100",
        textColor: "text-slate-600",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700"
      }
    };

    return typeMap[type] || {
      icon: AlertCircle,
      label: "Event",
      bgColor: "bg-slate-100",
      textColor: "text-slate-600",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-700"
    };
  };

  const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      org_admin: "Admin",
      reviewer: "Reviewer",
      case_worker: "Case Worker",
      viewer: "Viewer",
      system: "System"
    };
    return roleMap[role] || role;
  };

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const handleSecureDownload = async () => {
    if (!document?.id || isDownloading) return;
    
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/documents/${document.id}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh download history
      const historyResponse = await fetch(`/api/documents/${document.id}/access-history`);
      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setDownloadHistory(data.history || []);
      }
    } catch (error: any) {
      console.error("Error downloading document:", error);
      alert(`Failed to download: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSecurePreview = async () => {
    if (!document?.id || isPreviewing) return;
    
    try {
      setIsPreviewing(true);
      const response = await fetch(`/api/documents/${document.id}/preview`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Preview failed");
      }

      // Refresh download history to show preview access
      const historyResponse = await fetch(`/api/documents/${document.id}/access-history`);
      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setDownloadHistory(data.history || []);
      }
    } catch (error: any) {
      console.error("Error previewing document:", error);
      alert(`Failed to preview: ${error.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <Card className="rounded-[28px] border border-border bg-white shadow-soft h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-950 truncate">
                {document.fileName}
              </h3>
              <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} flex-shrink-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{formatDocumentType(document.type)}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="preview" className="h-full">
          <TabsList className="w-full justify-start px-6 pt-4 bg-transparent border-b border-border rounded-none">
            <TabsTrigger value="preview">Preview & Details</TabsTrigger>
            <TabsTrigger value="review">Review Actions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="access">Download History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-6 space-y-6">
            {/* Security Status */}
            <div className="rounded-lg bg-success/5 border border-success/20 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-success">Secure Document Access</p>
                  <p className="text-xs text-slate-600 mt-1">
                    This document is protected by enterprise-grade security. All access is authenticated, authorized, and audited.
                  </p>
                </div>
              </div>
            </div>

            {/* Secure Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSecureDownload}
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Secure Download
                  </>
                )}
              </Button>
              {canPreview && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSecurePreview}
                  disabled={isPreviewing}
                  className="flex-1"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Secure Preview
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Document Preview */}
            {canPreview && showPreview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">Document Preview</h4>
                  <div className="flex items-center gap-2">
                    {(isImage || isPDF) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">{zoom}%</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-slate-50">
                  {isImage && (
                    <div className="p-4 overflow-auto max-h-[500px]">
                      <img
                        src={`/api/documents/${document.id}/preview`}
                        alt={document.fileName}
                        style={{ width: `${zoom}%` }}
                        className="mx-auto"
                      />
                    </div>
                  )}
                  
                  {isPDF && (
                    <iframe
                      src={`/api/documents/${document.id}/preview#zoom=${zoom}`}
                      className="w-full h-[500px] border-0"
                      title={document.fileName}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-xl p-8 text-center bg-slate-50">
                <FileIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  Preview not available for this file type
                </p>
                <Button size="sm" variant="outline" onClick={handleSecureDownload} disabled={isDownloading}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </>
                  )}
                </Button>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-950">Document Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-4 w-4" />
                    <span>Uploaded By</span>
                  </div>
                  <p className="text-sm font-medium text-slate-950">
                    {document.uploadedBy.name || document.uploadedBy.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>Upload Date</span>
                  </div>
                  <p className="text-sm font-medium text-slate-950">
                    {new Date(document.uploadedAt).toLocaleString()}
                  </p>
                </div>

                {document.size && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <FileText className="h-4 w-4" />
                      <span>File Size</span>
                    </div>
                    <p className="text-sm font-medium text-slate-950">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                )}

                {document.verification?.reviewedByUser && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="h-4 w-4" />
                      <span>Reviewed By</span>
                    </div>
                    <p className="text-sm font-medium text-slate-950">
                      {document.verification.reviewedByUser.name}
                    </p>
                  </div>
                )}

                {document.verification?.reviewedAt && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>Review Date</span>
                    </div>
                    <p className="text-sm font-medium text-slate-950">
                      {new Date(document.verification.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {document.verification?.rejectionReason && (
                <div className="rounded-lg bg-error/5 border border-error/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-error mb-1">Rejection Reason</p>
                      <p className="text-sm text-slate-700">{document.verification.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {document.verification?.notes && (
                <div className="rounded-lg bg-slate-50 border border-border p-4">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-950 mb-1">Internal Notes</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{document.verification.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Review Actions Tab */}
          <TabsContent value="review" className="p-6 space-y-4">
            {activeAction === null ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-950">Review Actions</h4>
                
                <Button
                  className="w-full justify-start bg-success hover:bg-success/90 text-white"
                  onClick={() => setActiveAction("approve")}
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Document
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveAction("reject")}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Document
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveAction("replace")}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Replacement
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => onMarkPending()}
                  disabled={loading}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark as Pending
                </Button>
              </div>
            ) : activeAction === "approve" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">Approve Document</h4>
                  <Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="approve-notes">Internal Notes (Optional)</Label>
                    <Textarea
                      id="approve-notes"
                      placeholder="Add internal notes for this approval..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                      onClick={handleApprove}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Confirm Approval"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveAction(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : activeAction === "reject" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">Reject Document</h4>
                  <Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reject-reason">Rejection Reason (Required) *</Label>
                    <Textarea
                      id="reject-reason"
                      placeholder="Explain why this document is being rejected..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reject-notes">Internal Notes (Optional)</Label>
                    <Textarea
                      id="reject-notes"
                      placeholder="Add internal notes..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-error hover:bg-error/90 text-white"
                      onClick={handleReject}
                      disabled={loading || !rejectReason.trim()}
                    >
                      {loading ? "Processing..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveAction(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : activeAction === "replace" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-950">Request Replacement</h4>
                  <Button size="sm" variant="ghost" onClick={() => setActiveAction(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="replace-reason">Reason (Required) *</Label>
                    <Textarea
                      id="replace-reason"
                      placeholder="Explain why a replacement is needed..."
                      value={replaceReason}
                      onChange={(e) => setReplaceReason(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="replace-deadline">Deadline (Optional)</Label>
                    <input
                      id="replace-deadline"
                      type="date"
                      value={replaceDeadline}
                      onChange={(e) => setReplaceDeadline(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="replace-instructions">Instructions for Applicant (Optional)</Label>
                    <Textarea
                      id="replace-instructions"
                      placeholder="Provide specific instructions..."
                      value={replaceInstructions}
                      onChange={(e) => setReplaceInstructions(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-warning hover:bg-warning/90 text-white"
                      onClick={handleRequestReplacement}
                      disabled={loading || !replaceReason.trim()}
                    >
                      {loading ? "Processing..." : "Request Replacement"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveAction(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-950">Review History</h4>
                {!historyLoading && history.length > 0 && (
                  <Badge className="text-xs border border-border">
                    {history.length} {history.length === 1 ? "event" : "events"}
                  </Badge>
                )}
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-brand animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading history...</p>
                  </div>
                </div>
              ) : historyError ? (
                <div className="rounded-lg bg-error/5 border border-error/20 p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-error mx-auto mb-3" />
                  <p className="text-sm font-medium text-error mb-1">Failed to load history</p>
                  <p className="text-xs text-slate-600">{historyError}</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600 mb-1">No History Yet</p>
                  <p className="text-xs text-slate-500">
                    Review actions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => {
                    const isLast = index === history.length - 1;
                    const actionInfo = getActionInfo(item.type);
                    const ActionIcon = actionInfo.icon;

                    return (
                      <div key={item.id} className="relative">
                        {/* Timeline connector */}
                        {!isLast && (
                          <div className="absolute left-[17px] top-10 w-0.5 h-[calc(100%+16px)] bg-slate-200" />
                        )}

                        <div className="flex gap-4">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-9 h-9 rounded-full ${actionInfo.bgColor} flex items-center justify-center relative z-10`}>
                            <ActionIcon className={`h-4 w-4 ${actionInfo.textColor}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-950">
                                  {item.action}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <div className="flex items-center gap-1 text-xs text-slate-600">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium">{item.actor.name}</span>
                                  </div>
                                  {item.actor.role && item.actor.role !== "system" && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Shield className="h-3 w-3" />
                                      <span>{formatRole(item.actor.role)}</span>
                                    </div>
                                  )}
                                  {item.actor.organization && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Building2 className="h-3 w-3" />
                                      <span>{item.actor.organization}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatTimestamp(item.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className={`${actionInfo.badgeBg} ${actionInfo.badgeText} flex-shrink-0`}>
                                {actionInfo.label}
                              </Badge>
                            </div>

                            {/* Metadata */}
                            {item.metadata && (
                              <div className="mt-3 space-y-2">
                                {item.metadata.reason && (
                                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                                    <p className="text-xs font-semibold text-slate-700 mb-1">Reason</p>
                                    <p className="text-sm text-slate-600">{item.metadata.reason}</p>
                                  </div>
                                )}
                                {item.metadata.rejectionReason && (
                                  <div className="rounded-lg bg-error/5 border border-error/20 p-3">
                                    <p className="text-xs font-semibold text-error mb-1">Rejection Reason</p>
                                    <p className="text-sm text-slate-600">{item.metadata.rejectionReason}</p>
                                  </div>
                                )}
                                {item.metadata.notes && (
                                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="h-3 w-3 text-slate-600" />
                                      <p className="text-xs font-semibold text-slate-700">Internal Notes</p>
                                    </div>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.metadata.notes}</p>
                                  </div>
                                )}
                                {item.metadata.instructions && (
                                  <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                                    <p className="text-xs font-semibold text-info mb-1">Instructions for Applicant</p>
                                    <p className="text-sm text-slate-600">{item.metadata.instructions}</p>
                                  </div>
                                )}
                                {item.metadata.deadline && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Clock className="h-3 w-3" />
                                    <span>Deadline: {new Date(item.metadata.deadline).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {item.metadata.notePreview && (
                                  <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Send className="h-3 w-3 text-info" />
                                      <p className="text-xs font-semibold text-info">Note to Applicant</p>
                                    </div>
                                    <p className="text-sm text-slate-600">{item.metadata.notePreview}</p>
                                  </div>
                                )}
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
          </TabsContent>

          {/* Download History Tab */}
          <TabsContent value="access" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  <h4 className="text-sm font-semibold text-slate-950">Download & Preview Access</h4>
                </div>
                {!downloadHistoryLoading && downloadHistory.length > 0 && (
                  <Badge className="text-xs border border-border">
                    {downloadHistory.length} {downloadHistory.length === 1 ? "access" : "accesses"}
                  </Badge>
                )}
              </div>

              <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700">
                    All document downloads and previews are logged for security and audit compliance. 
                    This ensures full traceability of document access across your organization.
                  </p>
                </div>
              </div>

              {downloadHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-brand animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading access history...</p>
                  </div>
                </div>
              ) : downloadHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600 mb-1">No Access History</p>
                  <p className="text-xs text-slate-500">
                    Download or preview attempts will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloadHistory.map((access) => {
                    const isSuccess = access.success;
                    const isDownload = access.action === "download";

                    return (
                      <div
                        key={access.id}
                        className={`rounded-lg border p-4 ${
                          isSuccess
                            ? "bg-white border-border"
                            : "bg-error/5 border-error/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* User Info */}
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-slate-600 flex-shrink-0" />
                              <p className="text-sm font-semibold text-slate-950">
                                {access.user?.name || "Unknown User"}
                              </p>
                              {isSuccess ? (
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-error flex-shrink-0" />
                              )}
                            </div>

                            {/* Action Details */}
                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                {isDownload ? (
                                  <Download className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                                <span className="font-medium">
                                  {isDownload ? "Downloaded" : "Previewed"}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatTimestamp(access.timestamp)}</span>
                              </div>

                              {access.fileSize && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{formatFileSize(access.fileSize)}</span>
                                </div>
                              )}

                              {access.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{access.duration}ms</span>
                                </div>
                              )}
                            </div>

                            {/* Failure Reason */}
                            {!isSuccess && access.failureReason && (
                              <div className="mt-3 rounded-lg bg-error/5 border border-error/20 p-2">
                                <p className="text-xs font-semibold text-error mb-1">
                                  Access Denied
                                </p>
                                <p className="text-xs text-slate-600">
                                  {access.failureReason}
                                </p>
                              </div>
                            )}

                            {/* IP Address (if available) */}
                            {access.ipAddress && (
                              <div className="mt-2 text-xs text-slate-500">
                                IP: {access.ipAddress}
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <Badge
                            className={`flex-shrink-0 ${
                              isSuccess
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {isSuccess ? "Success" : "Failed"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="p-6 space-y-6">
            {/* Internal Notes */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-950">Internal Staff Notes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Only visible to staff members • Not shown to applicants
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Add internal note for staff review..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleAddInternalNote}
                  disabled={loading || !internalNote.trim()}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding Note...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Internal Note
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Applicant Notes */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Send className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-950">Send Note to Applicant</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visible to applicant in Communication Center • Creates timeline event • Triggers notification
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-info/5 border border-info/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700">
                    This note will be sent through the Communication Center and will appear in:
                  </p>
                </div>
                <ul className="mt-2 ml-6 space-y-1 text-xs text-slate-600">
                  <li>• Applicant's Communication Center</li>
                  <li>• Application Timeline</li>
                  <li>• In-app and email notifications (if enabled)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Write a note to the applicant about this document..."
                  value={applicantNote}
                  onChange={(e) => setApplicantNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleAddApplicantNote}
                  disabled={sendingNote || !applicantNote.trim()}
                  className="w-full bg-info hover:bg-info/90"
                >
                  {sendingNote ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending to Applicant...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Note to Applicant
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500">
                  {applicantNote.trim().length > 0 && (
                    <span>{applicantNote.length} characters</span>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
