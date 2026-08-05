/**
 * COMMUNICATION COMPOSER TYPES
 * 
 * Defines all types and interfaces for the unified CommunicationComposer component.
 * These types are shared across all communication modes.
 */

/**
 * All supported communication modes
 */
export type CommunicationMode = 
  | "message"                  // Direct 1:1 case message to applicant/staff
  | "email"                    // Formatted email with subject line
  | "reply"                    // Reply to previous message
  | "announcement"             // Broadcast to multiple recipients
  | "document_request"         // Request documents with deadline
  | "decision_notification"    // Notify decision (approved/rejected/etc)
  | "system_notification";     // Read-only system notifications

/**
 * Message type mapping for CaseMessage model
 */
export const CommunicationModeToMessageType: Record<CommunicationMode, string> = {
  message: "normal",
  email: "email",
  reply: "normal",
  announcement: "announcement",
  document_request: "document_request",
  decision_notification: "decision_notification",
  system_notification: "system_notification",
};

/**
 * UI labels for each mode
 */
export const CommunicationModeLabels: Record<CommunicationMode, string> = {
  message: "Message",
  email: "Email",
  reply: "Reply",
  announcement: "Announcement",
  document_request: "Document Request",
  decision_notification: "Decision Notification",
  system_notification: "System Notification",
};

/**
 * Mode-specific badge colors
 */
export const CommunicationModeBadgeColors: Record<CommunicationMode, string> = {
  message: "bg-blue-100 text-blue-800",
  email: "bg-purple-100 text-purple-800",
  reply: "bg-indigo-100 text-indigo-800",
  announcement: "bg-green-100 text-green-800",
  document_request: "bg-orange-100 text-orange-800",
  decision_notification: "bg-red-100 text-red-800",
  system_notification: "bg-gray-100 text-gray-800",
};

/**
 * Draft save status
 */
export type DraftStatus = "clean" | "unsaved" | "saving" | "saved";

/**
 * Recipient in the composer
 * Supports both internal (userId present) and external (userId null) recipients
 */
export interface Recipient {
  id: string;
  email: string;
  name?: string;
  role?: "staff" | "applicant" | "admin" | "external" | "recipient";
  organizationId?: string;
  userId?: string | null; // null for external recipients
  isExternal?: boolean;
}

/**
 * Attachment metadata
 */
export interface ComposerAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Document request specific data
 */
export interface DocumentRequestData {
  documentTypes: string[];
  deadline: Date;
  priority: "low" | "medium" | "high";
  notes?: string;
}

/**
 * Decision notification specific data
 */
export interface DecisionNotificationData {
  decision: "approved" | "rejected" | "conditional" | "waitlisted" | "under_review";
  decisionSummary: string;
  reason?: string;
  conditionsIfApplicable?: string;
}

/**
 * Complete draft state
 */
export interface ComposerDraft {
  id?: string;
  subject: string;
  body: string;
  recipients: Recipient[];
  attachments: ComposerAttachment[];
  senderIdentityId?: string;
  documentTypes?: string[];
  deadline?: Date;
  priority?: "low" | "medium" | "high";
  decisionSummary?: string;
  decision?: "approved" | "rejected" | "conditional" | "waitlisted" | "under_review";
  templateId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Composer props
 */
export interface CommunicationComposerProps {
  // Required
  mode: CommunicationMode;
  onClose: () => void;

  // Context
  applicationId?: string;
  organizationId?: string;

  // Single recipient mode
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;

  // Callbacks
  onSuccess?: (message: any) => void;
  onError?: (error: Error) => void;

  // Initial data
  initialData?: {
    subject?: string;
    body?: string;
    recipients?: Recipient[];
    attachments?: ComposerAttachment[];
    documentTypes?: string[];
    deadline?: Date;
    decisionSummary?: string;
  };

  // Permissions
  readOnly?: boolean;
}

/**
 * Composer context (for future use with useContext)
 */
export interface ComposerContext {
  mode: CommunicationMode;
  draft: ComposerDraft;
  draftStatus: DraftStatus;
  loading: boolean;
  error: string | null;
  success: string | null;
  setDraft: (draft: Partial<ComposerDraft>) => void;
  saveDraft: () => Promise<void>;
  sendComposition: () => Promise<void>;
}

/**
 * API request/response types
 */
export interface SendMessageRequest {
  applicationId: string;
  organizationId: string;
  content: string;
  messageType: string;
  senderIdentityId?: string;
  attachments?: string[];
  subject?: string;
  recipients?: string[];
}

export interface SendMessageResponse {
  success: boolean;
  data?: {
    id: string;
    conversationId: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name?: string;
      email: string;
    };
  };
  error?: string;
}

/**
 * Mode behavior matrix - determines field visibility
 */
export const ModeBehavior: Record<CommunicationMode, {
  hasRecipient: boolean;
  hasSubject: boolean;
  hasMultiRecipient: boolean;
  hasTemplate: boolean;
  hasAttachments: boolean;
  hasDocumentRequest?: boolean;
  hasDecisionData?: boolean;
  isReadOnly: boolean;
  requiresApplicationId: boolean;
}> = {
  message: {
    hasRecipient: true,
    hasSubject: false,
    hasMultiRecipient: false,
    hasTemplate: true,
    hasAttachments: true,
    isReadOnly: false,
    requiresApplicationId: true,
  },
  email: {
    hasRecipient: true,
    hasSubject: true,
    hasMultiRecipient: false,
    hasTemplate: true,
    hasAttachments: true,
    isReadOnly: false,
    requiresApplicationId: false,
  },
  reply: {
    hasRecipient: true,
    hasSubject: false,
    hasMultiRecipient: false,
    hasTemplate: true,
    hasAttachments: true,
    isReadOnly: false,
    requiresApplicationId: true,
  },
  announcement: {
    hasRecipient: true,
    hasSubject: true,
    hasMultiRecipient: true,
    hasTemplate: true,
    hasAttachments: true,
    isReadOnly: false,
    requiresApplicationId: false,
  },
  document_request: {
    hasRecipient: true,
    hasSubject: false,
    hasMultiRecipient: false,
    hasTemplate: false,
    hasAttachments: false,
    hasDocumentRequest: true,
    isReadOnly: false,
    requiresApplicationId: true,
  },
  decision_notification: {
    hasRecipient: true,
    hasSubject: false,
    hasMultiRecipient: false,
    hasTemplate: true,
    hasAttachments: false,
    hasDecisionData: true,
    isReadOnly: false,
    requiresApplicationId: true,
  },
  system_notification: {
    hasRecipient: false,
    hasSubject: false,
    hasMultiRecipient: false,
    hasTemplate: false,
    hasAttachments: false,
    isReadOnly: true,
    requiresApplicationId: true,
  },
};
