"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { RequiredDocumentsMatrix } from "./required-documents-matrix";
import { DocumentListProfessional } from "./document-list-professional";
import { DocumentDetailsPanel } from "./document-details-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface DocumentReviewWorkspaceProps {
  caseId: string;
  programRequiredDocuments?: string[];
}

export function DocumentReviewWorkspace({
  caseId,
  programRequiredDocuments = []
}: DocumentReviewWorkspaceProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load documents
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/cases/${caseId}/documents`);
      if (!response.ok) throw new Error("Failed to load documents");
      const result = await response.json();
      setDocuments(result.data || []);
    } catch (err: any) {
      console.error("Error loading documents:", err);
      setError(err.message || "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  // Document actions
  const handleDocumentAction = async (
    docId: string,
    action: string,
    params?: any
  ) => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`/api/cases/${caseId}/documents/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Action failed");
      }

      // Success - reload documents
      await loadDocuments();

      // Update selected document if it was the one modified
      if (selectedDocument?.id === docId) {
        const updated = documents.find((d) => d.id === docId);
        if (updated) {
          setSelectedDocument(updated);
        }
      }
    } catch (err: any) {
      console.error("Error performing document action:", err);
      setError(err.message || "Failed to perform action");
      throw err; // Re-throw so the details panel can handle it
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (notes?: string) => {
    if (!selectedDocument) return;
    await handleDocumentAction(selectedDocument.id, "approve", {
      notes: notes || undefined,
    });
  };

  const handleReject = async (reason: string, notes?: string) => {
    if (!selectedDocument) return;
    await handleDocumentAction(selectedDocument.id, "reject", {
      reason,
      notes: notes || undefined,
    });
  };

  const handleRequestReplacement = async (
    reason: string,
    deadline?: string,
    instructions?: string
  ) => {
    if (!selectedDocument) return;
    await handleDocumentAction(selectedDocument.id, "request_replacement", {
      reason,
      deadline: deadline || undefined,
      instructions: instructions || undefined,
    });
  };

  const handleMarkPending = async () => {
    if (!selectedDocument) return;
    await handleDocumentAction(selectedDocument.id, "mark_pending");
  };

  const handleAddNote = async (note: string, isInternal: boolean) => {
    if (!selectedDocument) return;
    // For now, internal notes use the add_note action
    // Applicant notes would go through a different mechanism (communication center)
    if (isInternal) {
      await handleDocumentAction(selectedDocument.id, "add_note", {
        notes: note,
      });
    } else {
      // TODO: Implement applicant-visible notes through communication center
      console.log("Applicant note:", note);
      alert("Applicant notes will be sent through the Communication Center");
    }
  };

  const handleSelectDocument = (document: DocumentItem) => {
    setSelectedDocument(document);
  };

  const handleRequestDocument = (docType: string) => {
    // TODO: Implement document request workflow
    console.log("Request document:", docType);
    alert(`Document request for ${docType} will be implemented`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Required Documents Matrix */}
      {programRequiredDocuments.length > 0 && (
        <RequiredDocumentsMatrix
          requiredDocuments={programRequiredDocuments}
          uploadedDocuments={documents}
          onRequestDocument={handleRequestDocument}
          onSelectDocument={handleSelectDocument}
        />
      )}

      {/* Document Review Workspace */}
      {/* Desktop: Two Column Layout, Mobile: Single Column with Slide-over */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:gap-6 grid-cols-1 lg:grid-cols-[1fr_500px] w-full">
        {/* Left: Document List - Always visible on desktop, hidden when document selected on mobile */}
        <div className={`${selectedDocument ? 'hidden lg:block' : 'block'}`}>
          <DocumentListProfessional
            documents={documents}
            selectedDocumentId={selectedDocument?.id}
            onSelectDocument={handleSelectDocument}
          />
        </div>

        {/* Right: Document Details Panel - Slide-over on mobile, Fixed column on desktop */}
        <div className={`${selectedDocument ? 'block' : 'hidden lg:block'}`}>
          <DocumentDetailsPanel
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestReplacement={handleRequestReplacement}
            onMarkPending={handleMarkPending}
            onAddNote={handleAddNote}
            loading={actionLoading}
          />
        </div>
      </div>
    </div>
  );
}
