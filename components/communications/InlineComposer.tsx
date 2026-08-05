"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, Send, Paperclip, AlertCircle, CheckCircle, Clock,
  FileText, AlertTriangle, ChevronUp, ChevronDown
} from "lucide-react";
import { RecipientPickerInline } from "./RecipientPickerInline";
import type { CommunicationMode } from "./CommunicationComposer";
import type { RecipientCard } from "@/lib/communications/recipient.types";
import { useCommunicationExecutionContext } from "./communication-execution-context";

/**
 * Milestone 7 Phase 1: Inline Composer
 * 
 * Bottom-panel composer that stays on screen
 * - Does NOT use modal overlay
 * - Slides up from bottom on desktop
 * - Full screen on mobile
 * - Auto-saves drafts
 * - No navigation required after send
 * 
 * Converted from CommunicationComposer modal to inline panel
 */

export interface InlineComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: any) => void;
  onError?: (error: Error) => void;
  mode?: CommunicationMode;
  applicationId?: string;
  organizationId?: string;
  prefilledRecipient?: {
    id: string;
    email: string;
    name?: string;
  };
  draft?: {
    subject?: string;
    body?: string;
    recipients?: RecipientCard[];
  };
}

export function InlineComposer({
  isOpen,
  onClose,
  onSuccess,
  onError,
  mode = "message",
  applicationId,
  organizationId,
  prefilledRecipient,
  draft: initialDraft,
}: InlineComposerProps) {
  const { organizationId: contextOrganizationId } = useCommunicationExecutionContext();
  const resolvedOrganizationId = organizationId ?? contextOrganizationId;
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [recipients, setRecipients] = useState<RecipientCard[]>(
    prefilledRecipient 
      ? [prefilledRecipient as RecipientCard]
      : initialDraft?.recipients || []
  );
  const [charCount, setCharCount] = useState(body.length);

  const [draftStatus, setDraftStatus] = useState<"clean" | "unsaved" | "saving" | "saved">("clean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isOpen) return;

    if (draftStatus === "unsaved") {
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 30000);
    }

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [draftStatus, body, subject, recipients, isOpen]);

  // Restore draft on open
  useEffect(() => {
    if (isOpen && applicationId) {
      try {
        const stored = localStorage.getItem(`draft-${mode}-${applicationId}`);
        if (stored) {
          const { subject: s, body: b, recipients: r } = JSON.parse(stored);
          if (s) setSubject(s);
          if (b) setBody(b);
          if (r) setRecipients(r);
        }
      } catch (err) {
        console.warn("Failed to restore draft:", err);
      }
    }
  }, [isOpen, applicationId, mode]);

  // Focus body when opened and not collapsed
  useEffect(() => {
    if (isOpen && !isCollapsed && bodyInputRef.current) {
      bodyInputRef.current.focus();
    }
  }, [isOpen, isCollapsed]);

  const saveDraft = async () => {
    try {
      setDraftStatus("saving");
      localStorage.setItem(
        `draft-${mode}-${applicationId}`,
        JSON.stringify({ subject, body, recipients })
      );
      setDraftStatus("saved");
      setSuccess("Draft saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save draft");
    }
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    setCharCount(text.length);
    setDraftStatus("unsaved");
  };

  const handleSubjectChange = (text: string) => {
    setSubject(text);
    setDraftStatus("unsaved");
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!body.trim()) {
        throw new Error("Message body is required");
      }

      if (recipients.length === 0) {
        throw new Error("At least one recipient is required");
      }

      if (mode === "email" && !subject.trim()) {
        throw new Error("Subject is required for emails");
      }

      // Send message
      if (applicationId && resolvedOrganizationId) {
        const response = await fetch("/api/communications/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            organizationId: resolvedOrganizationId,
            content: subject ? `**${subject}**\n\n${body}` : body,
            messageType: mode === "email" ? "email" : "normal",
            recipients: recipients.map(r => r.email),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const result = await response.json();
        
        // Clear draft
        setSubject("");
        setBody("");
        setRecipients([]);
        setCharCount(0);
        setDraftStatus("clean");
        localStorage.removeItem(`draft-${mode}-${applicationId}`);

        setSuccess("Message sent successfully");
        setTimeout(() => {
          setSuccess(null);
          onSuccess?.(result.data);
          onClose();
        }, 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Collapsed view (mobile or user preference)
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-0 right-4 sm:right-6 z-40 bg-brand text-white rounded-t-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-brand/90 transition"
      >
        <span className="text-sm font-medium">Compose</span>
        <ChevronUp className="h-4 w-4" />
      </button>
    );
  }

  // Full composer view
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl">
      {/* Drag handle / collapse bar */}
      <div className="hidden sm:flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 rounded-full bg-slate-300"></div>
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
            Compose {mode === "email" ? "Email" : "Message"}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-slate-200 rounded transition text-slate-500"
          aria-label="Collapse composer"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile header with close */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <span className="text-sm font-semibold text-slate-900">
          Compose {mode === "email" ? "Email" : "Message"}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition text-slate-500"
          aria-label="Close composer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Recipient picker */}
          {organizationId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recipients
              </label>
              <RecipientPickerInline
                organizationId={resolvedOrganizationId || ""}
                value={recipients}
                onChange={setRecipients}
                mode={mode === "announcement" ? "multi" : "single"}
              />
            </div>
          )}

          {/* Subject field (email only) */}
          {mode === "email" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Enter subject line..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          )}

          {/* Message body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message
            </label>
            <textarea
              ref={bodyInputRef}
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
            />
            <div className="text-xs text-slate-500 mt-1">
              {charCount} characters
              {draftStatus === "saving" && (
                <span className="ml-2 text-slate-400 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {draftStatus === "saved" && (
                <span className="ml-2 text-green-600 inline-flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Action buttons */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={saveDraft}
            disabled={draftStatus === "clean" || draftStatus === "saving"}
            className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 transition font-medium"
          >
            Save Draft
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || recipients.length === 0 || !body.trim()}
            className="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
