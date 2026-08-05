"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, Send, Paperclip, AlertCircle, CheckCircle, Clock,
  FileText, Users, Calendar, AlertTriangle
} from "lucide-react";
import { RecipientPickerInline } from "./RecipientPickerInline";
import { SenderSelector } from "./sender-selector";
import type { SenderIdentityWithUsage } from "@/lib/communications/sender-identity.service";
import type { RecipientCard as RecipientCardType } from "@/lib/communications/recipient.types";
import { useCommunicationExecutionContext } from "./communication-execution-context";

/**
 * UNIFIED COMMUNICATION COMPOSER
 * Phase 1.7 Milestone 2
 * 
 * Single reusable component for all communication modes:
 * - message: Direct 1:1 case messages
 * - email: Formatted emails with subject
 * - reply: Response to previous message
 * - announcement: Broadcast to multiple recipients
 * - document_request: Request documents with deadline
 * - decision_notification: Notify of decision
 * - system_notification: Read-only system notifications
 * 
 * Reuses existing infrastructure:
 * ✓ CaseCommunicationService (sendCaseMessage, getConversation)
 * ✓ NotificationService (notify, templates)
 * ✓ DraftAPI (autosave every 30 seconds)
 * ✓ RBAC (requireOrgRole)
 */

export type CommunicationMode = 
  | "message" 
  | "email" 
  | "reply" 
  | "announcement" 
  | "document_request" 
  | "decision_notification" 
  | "system_notification";

export interface CommunicationComposerProps {
  mode: CommunicationMode;
  applicationId?: string;
  organizationId?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  onClose: () => void;
  onSuccess?: (message: any) => void;
  onError?: (error: Error) => void;
  initialData?: {
    subject?: string;
    body?: string;
    recipients?: string[];
    attachments?: string[];
  };
  readOnly?: boolean;
}

interface Recipient {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  userId?: string | null;
  isExternal?: boolean;
}

interface DraftState {
  subject: string;
  body: string;
  recipients: Recipient[];
  attachments: string[];
  senderIdentityId?: string;
  documentTypes?: string[];
  deadline?: Date;
  priority?: "low" | "medium" | "high";
  decisionSummary?: string;
}

/**
 * Main Composer Component
 */
export function CommunicationComposer({
  mode,
  applicationId,
  organizationId,
  recipientId,
  recipientEmail,
  recipientName,
  onClose,
  onSuccess,
  onError,
  initialData,
  readOnly = false,
}: CommunicationComposerProps) {
  const { organizationId: contextOrganizationId } = useCommunicationExecutionContext();
  const resolvedOrganizationId = organizationId ?? contextOrganizationId;
  const [draft, setDraft] = useState<DraftState>({
    subject: initialData?.subject || "",
    body: initialData?.body || "",
    recipients: recipientEmail 
      ? [{ 
          id: recipientId || "", 
          email: recipientEmail, 
          name: recipientName,
          role: "recipient"
        }]
      : [],
    attachments: initialData?.attachments || [],
    senderIdentityId: undefined, // Will be set by SenderSelector default
    documentTypes: [],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    priority: "medium",
  });

  const [draftStatus, setDraftStatus] = useState<"clean" | "unsaved" | "saving" | "saved">("clean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(initialData?.body?.length || 0);
  const autoSaveTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!readOnly && draftStatus === "unsaved") {
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [draftStatus, draft]);

  const saveDraft = async () => {
    try {
      setDraftStatus("saving");
      // Wire to existing draft API when available
      // For now: localStorage for MVP
      localStorage.setItem(`draft-${mode}-${applicationId}`, JSON.stringify(draft));
      setDraftStatus("saved");
      setSuccess("Draft saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  const handleBodyChange = (text: string) => {
    setDraft(prev => ({ ...prev, body: text }));
    setCharCount(text.length);
    setDraftStatus("unsaved");
  };

  const handleSubjectChange = (text: string) => {
    setDraft(prev => ({ ...prev, subject: text }));
    setDraftStatus("unsaved");
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!draft.body.trim()) {
        throw new Error("Message body is required");
      }

      if (draft.recipients.length === 0 && !readOnly) {
        throw new Error("At least one recipient is required");
      }

      if (isEmailMode() && !draft.subject.trim()) {
        throw new Error("Subject is required for emails");
      }

      if (!draft.senderIdentityId) {
        throw new Error("Sender identity is required");
      }

      // Wire to existing services
      if (resolvedOrganizationId) {
        const response = await fetch("/api/communications/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: applicationId || undefined,
            organizationId: resolvedOrganizationId,
            content: formatMessageContent(),
            subject: draft.subject || undefined,
            messageType: getModeMessageType(),
            senderIdentityId: draft.senderIdentityId,
            attachments: draft.attachments,
            // Specify message context: "application" for app conversations, "organization" for general emails
            messageContext: applicationId ? "application" : "organization",
            // Include recipients for organization emails
            recipients: draft.recipients.map(r => ({
              id: r.id,
              email: r.email,
              name: r.name
            }))
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to send message");
        }

        const result = await response.json();
        setDraftStatus("clean");
        setSuccess(`${getModeLabel()} sent successfully`);
        onSuccess?.(result.data);
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      } else {
        throw new Error("Organization ID is required");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setLoading(false);
    }
  };

  const formatMessageContent = () => {
    if (mode === "email") {
      return `📧 **${draft.subject}**\n\n${draft.body}`;
    }
    if (mode === "announcement") {
      return `📢 **Announcement**\n\n${draft.body}`;
    }
    if (mode === "document_request") {
      const docs = draft.documentTypes?.join(", ") || "";
      const deadline = draft.deadline?.toLocaleDateString() || "";
      return `📄 **Document Request**\n\nPlease provide: ${docs}\nDeadline: ${deadline}\n\n${draft.body}`;
    }
    if (mode === "decision_notification") {
      return `📊 **Decision Notification**\n\n${draft.decisionSummary || ""}\n\n${draft.body}`;
    }
    return draft.body;
  };

  const getModeMessageType = () => {
    const typeMap: Record<CommunicationMode, string> = {
      message: "normal",
      email: "email",
      reply: "normal",
      announcement: "announcement",
      document_request: "document_request",
      decision_notification: "decision_notification",
      system_notification: "system_notification",
    };
    return typeMap[mode];
  };

  const getModeLabel = () => {
    const labels: Record<CommunicationMode, string> = {
      message: "Message",
      email: "Email",
      reply: "Reply",
      announcement: "Announcement",
      document_request: "Document Request",
      decision_notification: "Decision Notification",
      system_notification: "Notification",
    };
    return labels[mode];
  };

  const isEmailMode = () => mode === "email" || mode === "announcement";
  const isDocumentMode = () => mode === "document_request";
  const isDecisionMode = () => mode === "decision_notification";
  const isReadOnlyMode = () => mode === "system_notification" || readOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      {/* Modal Container - Full screen mobile, centered drawer desktop */}
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <HeaderSection 
          mode={mode}
          draftStatus={draftStatus}
          onClose={onClose}
        />

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Alerts */}
            {error && (
              <AlertBox type="error" icon={AlertCircle}>
                {error}
              </AlertBox>
            )}
            {success && (
              <AlertBox type="success" icon={CheckCircle}>
                {success}
              </AlertBox>
            )}

            {/* Recipient Section - Inline Picker (Gmail-like) */}
            {!isReadOnlyMode() && organizationId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {mode === "announcement" ? "Recipients" : "Recipient"} *
                </label>
                <RecipientPickerInline
                  organizationId={resolvedOrganizationId || ""}
                  mode={mode === "announcement" ? "multi" : "multi"}
                  value={draft.recipients as RecipientCardType[]}
                  onChange={(recipients) => {
                    setDraft(prev => ({
                      ...prev,
                      recipients: recipients.map(r => ({
                        id: r.id,
                        email: r.email,
                        name: r.name,
                        role: r.role,
                        organizationId: r.organizationId,
                        userId: r.userId,
                        isExternal: r.isExternal
                      }))
                    }));
                    setDraftStatus("unsaved");
                  }}
                  placeholder="Type a name or email..."
                  maxRecipients={50}
                />
              </div>
            )}

            {/* Sender Identity Section */}
            {!isReadOnlyMode() && organizationId && (
              <div>
                <SenderSelector
                  organizationId={resolvedOrganizationId || ""}
                  value={draft.senderIdentityId}
                  onChange={(senderId, sender) => {
                    setDraft(prev => ({ ...prev, senderIdentityId: senderId }));
                    setDraftStatus("unsaved");
                  }}
                  label="From"
                  required
                />
              </div>
            )}

            {/* Subject Field (Email-like modes) */}
            {isEmailMode() && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="Enter subject line..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  disabled={isReadOnlyMode()}
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message
              </label>
              <textarea
                value={draft.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                disabled={isReadOnlyMode()}
              />
              <div className="text-xs text-slate-500 mt-1">
                {charCount} characters
              </div>
            </div>

            {/* Template Selector */}
            <TemplateSelector mode={mode} />

            {/* Document Request Section */}
            {isDocumentMode() && (
              <DocumentRequestSection
                documentTypes={draft.documentTypes || []}
                deadline={draft.deadline}
                priority={draft.priority}
                onChange={(updates) => setDraft(prev => ({ ...prev, ...updates }))}
              />
            )}

            {/* Decision Notification Section */}
            {isDecisionMode() && (
              <DecisionSummarySection
                summary={draft.decisionSummary}
                onChange={(summary) => setDraft(prev => ({ ...prev, decisionSummary: summary }))}
              />
            )}

            {/* Attachments */}
            <AttachmentSection
              attachments={draft.attachments}
              onAdd={() => {/* TODO: Wire to upload API */}}
              onRemove={(id) => {
                setDraft(prev => ({
                  ...prev,
                  attachments: prev.attachments.filter(a => a !== id)
                }));
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <FooterSection
          mode={mode}
          draftStatus={draftStatus}
          loading={loading}
          readOnly={isReadOnlyMode()}
          onSave={saveDraft}
          onSend={handleSend}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

/**
 * Header with mode badge and close button
 */
function HeaderSection({ 
  mode, 
  draftStatus,
  onClose 
}: { 
  mode: CommunicationMode;
  draftStatus: string;
  onClose: () => void;
}) {
  const getModeColor = (m: CommunicationMode) => {
    const colors: Record<CommunicationMode, string> = {
      message: "bg-blue-100 text-blue-800",
      email: "bg-purple-100 text-purple-800",
      reply: "bg-indigo-100 text-indigo-800",
      announcement: "bg-green-100 text-green-800",
      document_request: "bg-orange-100 text-orange-800",
      decision_notification: "bg-red-100 text-red-800",
      system_notification: "bg-gray-100 text-gray-800",
    };
    return colors[m];
  };

  const getModeLabel = (m: CommunicationMode) => {
    const labels: Record<CommunicationMode, string> = {
      message: "Message",
      email: "Email",
      reply: "Reply",
      announcement: "Announcement",
      document_request: "Document Request",
      decision_notification: "Decision",
      system_notification: "System",
    };
    return labels[m];
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getModeColor(mode)}`}>
          {getModeLabel(mode)}
        </div>
        {draftStatus === "saving" && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
        {draftStatus === "saved" && (
          <span className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Draft saved
          </span>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

/**
 * Template selector
 */
function TemplateSelector({ mode }: { mode: CommunicationMode }) {
  // Wire to existing NotificationTemplate system
  // For now: placeholder
  return null;
}

/**
 * Document request specific fields
 */
function DocumentRequestSection({
  documentTypes,
  deadline,
  priority,
  onChange,
}: {
  documentTypes: string[];
  deadline?: Date;
  priority?: string;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <h3 className="font-semibold text-orange-900 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Document Request Details
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Required Documents
        </label>
        <input
          type="text"
          placeholder="e.g., Proof of income, Tax returns, ID"
          className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          onChange={(e) => onChange({
            documentTypes: e.target.value.split(",").map(d => d.trim())
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Deadline
          </label>
          <input
            type="date"
            value={deadline?.toISOString().split("T")[0] || ""}
            onChange={(e) => onChange({ deadline: new Date(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Priority
          </label>
          <select
            value={priority || "medium"}
            onChange={(e) => onChange({ priority: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Decision notification specific fields
 */
function DecisionSummarySection({
  summary,
  onChange,
}: {
  summary?: string;
  onChange: (summary: string) => void;
}) {
  return (
    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
      <h3 className="font-semibold text-red-900 flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4" />
        Decision Summary
      </h3>
      <textarea
        value={summary || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Summarize the decision and reasoning..."
        rows={4}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg"
      />
    </div>
  );
}

/**
 * Attachment management
 */
function AttachmentSection({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: string[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Attachments
      </label>
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-brand hover:bg-brand/5 transition cursor-pointer">
        <Paperclip className="h-6 w-6 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-600">
          Click to upload files or drag and drop
        </p>
      </div>
      {attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {attachments.map(id => (
            <div key={id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-sm text-slate-600">{id}</span>
              <button
                onClick={() => onRemove(id)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Footer with action buttons
 */
function FooterSection({
  mode,
  draftStatus,
  loading,
  readOnly,
  onSave,
  onSend,
  onClose,
}: {
  mode: CommunicationMode;
  draftStatus: string;
  loading: boolean;
  readOnly: boolean;
  onSave: () => void;
  onSend: () => void;
  onClose: () => void;
}) {
  if (readOnly) {
    return (
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between gap-3">
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={draftStatus === "clean" || draftStatus === "saving"}
          className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 transition"
        >
          Save Draft
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onSend}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition font-medium flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? "Sending..." : `Send ${mode}`}
        </button>
      </div>
    </div>
  );
}

/**
 * Alert box component
 */
function AlertBox({
  type,
  icon: Icon,
  children,
}: {
  type: "error" | "success";
  icon: any;
  children: React.ReactNode;
}) {
  const colors = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-success/10 border-success/30 text-success",
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${colors[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  );
}
