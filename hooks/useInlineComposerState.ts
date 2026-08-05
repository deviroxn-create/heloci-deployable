"use client";

import { useState, useCallback } from "react";

/**
 * Milestone 7 Phase 1: Inline Composer State Management
 * 
 * Manages:
 * - Composer visibility
 * - Draft data and persistence
 * - Communication mode
 * - Application context (applicationId, organizationId)
 */

export interface ComposerDraft {
  subject: string;
  body: string;
  recipients: Array<{
    id: string;
    email: string;
    name?: string;
  }>;
  attachments: string[];
}

export interface UseInlineComposerStateOptions {
  applicationId?: string;
  organizationId?: string;
  initialMode?: "message" | "email" | "announcement";
}

export function useInlineComposerState(options: UseInlineComposerStateOptions = {}) {
  const {
    applicationId,
    organizationId,
    initialMode = "message",
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"message" | "email" | "announcement">(initialMode);
  const [draft, setDraft] = useState<ComposerDraft>({
    subject: "",
    body: "",
    recipients: [],
    attachments: [],
  });

  // Load draft from localStorage if exists
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(
        `draft-${mode}-${applicationId}`
      );
      if (stored) {
        setDraft(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to load draft:", err);
    }
  }, [mode, applicationId]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(
        `draft-${mode}-${applicationId}`,
        JSON.stringify(draft)
      );
    } catch (err) {
      console.warn("Failed to save draft:", err);
    }
  }, [draft, mode, applicationId]);

  // Clear draft after send
  const clearDraft = useCallback(() => {
    setDraft({
      subject: "",
      body: "",
      recipients: [],
      attachments: [],
    });
    try {
      localStorage.removeItem(`draft-${mode}-${applicationId}`);
    } catch (err) {
      console.warn("Failed to clear draft:", err);
    }
  }, [mode, applicationId]);

  const openComposer = useCallback(() => {
    setIsOpen(true);
    loadDraft();
  }, [loadDraft]);

  const closeComposer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetComposer = useCallback(() => {
    clearDraft();
    closeComposer();
  }, [clearDraft, closeComposer]);

  return {
    // State
    isOpen,
    mode,
    draft,

    // Actions
    openComposer,
    closeComposer,
    resetComposer,
    setMode,
    setDraft,
    loadDraft,
    saveDraft,
    clearDraft,

    // Context
    applicationId,
    organizationId,
  };
}
