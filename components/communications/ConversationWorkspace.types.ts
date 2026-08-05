/**
 * Unified Conversation Workspace Types
 * Phase 1.7 Milestone 3
 *
 * Central type definitions for the conversation workspace component
 * and all related subcomponents.
 */

/**
 * Communication mode representing different types of messages/communications
 */
export type CommunicationMode =
  | "message"
  | "email"
  | "reply"
  | "announcement"
  | "document_request"
  | "decision_notification"
  | "system_notification";

/**
 * Timeline item type representing all communication-related events
 */
export type TimelineItemType =
  | "internal_message"
  | "applicant_message"
  | "email"
  | "document_request"
  | "document_upload"
  | "staff_note"
  | "status_change"
  | "decision"
  | "notification"
  | "system_event"
  | "announcement";

/**
 * Delivery status of a message/notification
 */
export type DeliveryStatus = "pending" | "sent" | "delivered" | "read" | "failed" | "bounced";

/**
 * Timeline action types for items
 */
export type TimelineAction =
  | "reply"
  | "copy"
  | "forward"
  | "open_email"
  | "download_attachment"
  | "mark_unread"
  | "jump_to_application"
  | "expand_thread";

/**
 * Core conversation data structure
 */
export interface ConversationData {
  // IDs
  applicationId: string;
  conversationId: string;
  organizationId: string;

  // Applicant info
  applicantName: string;
  applicantEmail: string;
  applicantId: string;

  // Program info
  programName: string;
  programId: string;

  // Organization info
  organizationName: string;

  // Application status
  status: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  // Timeline
  timeline: TimelineItem[];

  // Metadata
  messageCount: number;
  unreadCount: number;
  pendingDocuments: number;
  lastMessageAt: Date;
  createdAt: Date;

  // Pagination
  hasMore: boolean;
  pageInfo?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

/**
 * Individual timeline item representing an event/message
 */
export interface TimelineItem {
  // Identity
  id: string;
  type: TimelineItemType;
  timestamp: Date;

  // Sender/Actor
  actor: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatar?: string;
  };

  // Content
  content: string;
  subject?: string; // For emails
  messageBody?: string;
  summary?: string; // For system events

  // Attachments
  attachments?: Attachment[];

  // Status
  status: DeliveryStatus;
  isEdited?: boolean;
  editedAt?: Date;

  // Context
  replyTo?: {
    id: string;
    actorName: string;
    content: string;
  };

  // Document-specific
  documentRequest?: {
    documentType: string;
    deadline: Date;
    status: "pending" | "provided" | "rejected";
  };

  // Decision-specific
  decision?: {
    outcome: string;
    reason?: string;
    effectiveDate?: Date;
  };

  // Notification-specific
  notification?: {
    eventType: string;
    channel: string;
    deliveryStatus: DeliveryStatus;
  };

  // Metadata
  metadata?: Record<string, any>;
  threadId?: string;
  replyCount?: number;
}

/**
 * Attachment in a message
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
  uploadedAt: Date;
  uploadedBy?: {
    id: string;
    name: string;
  };
}

/**
 * Application context for the conversation
 */
export interface ApplicationContext {
  // Applicant
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;

  // Application
  programName: string;
  status: string;
  assignedTo?: string;
  createdAt: Date;
  lastActivityAt: Date;

  // Documents
  documentsPending: number;
  documentsUploaded: number;
  documentsRequired: string[];

  // Decisions
  recentDecisions: Decision[];

  // Notifications
  notificationPreferences: NotificationPreference;

  // Stats
  totalMessages: number;
  unreadMessages: number;
  averageResponseTime?: number; // In minutes
}

/**
 * Decision event
 */
export interface Decision {
  id: string;
  outcome: string;
  reason?: string;
  decidedBy: string;
  decidedAt: Date;
  effectiveDate?: Date;
}

/**
 * User notification preferences
 */
export interface NotificationPreference {
  email: boolean;
  sms?: boolean;
  inApp: boolean;
  pushNotifications?: boolean;
  digestFrequency?: "immediate" | "daily" | "weekly";
}

/**
 * Search result in conversation
 */
export interface SearchResult {
  id: string;
  type: TimelineItemType;
  preview: string;
  matchStart: number;
  matchEnd: number;
  confidence: number;
  timestamp: Date;
}

/**
 * Filtered/sorted timeline state
 */
export interface FilteredTimelineState {
  items: TimelineItem[];
  total: number;
  filtered: number;
  searchMatches: Map<string, SearchResult>;
  hasMore: boolean;
  isLoading: boolean;
}

/**
 * Draft state for auto-saving
 */
export interface DraftState {
  id: string;
  applicationId: string;
  mode: CommunicationMode;
  content: string;
  subject?: string;
  recipients: string[];
  attachments: Attachment[];
  lastSavedAt: Date;
  isDirty: boolean;
}

/**
 * Action payload for timeline item actions
 */
export interface TimelineActionPayload {
  itemId: string;
  action: TimelineAction;
  data?: {
    content?: string;
    recipients?: string[];
    replyTo?: string;
    [key: string]: any;
  };
}

/**
 * Response from action handlers
 */
export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Conversation workspace component props
 */
export interface ConversationWorkspaceProps {
  applicationId: string;
  organizationId: string;
  onClose?: () => void;
  readOnly?: boolean;
  initialTab?: "overview" | "documents" | "decisions";
  onMessageSent?: (message: TimelineItem) => void;
  onActionTriggered?: (action: TimelineActionPayload) => void;
}

/**
 * Message composer integration props
 */
export interface MessageComposerIntegration {
  applicationId: string;
  organizationId: string;
  recipientEmail?: string;
  recipientName?: string;
  mode?: CommunicationMode;
  replyTo?: TimelineItem;
  onClose: () => void;
  onSuccess: (message: TimelineItem) => void;
}

/**
 * Lazy loading configuration
 */
export interface LazyLoadConfig {
  enabled: boolean;
  pageSize: number;
  threshold: number; // pixels from bottom
  autoLoad: boolean;
}

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  renderBuffer: number;
}

/**
 * Timeline options
 */
export interface TimelineOptions {
  groupByDate: boolean;
  chronological: boolean; // false = reverse chronological
  highlightSearch: boolean;
  showAvatars: boolean;
  showTimestamps: boolean;
  compactView: boolean;
  lazyLoad: LazyLoadConfig;
  virtualScroll: VirtualScrollConfig;
}

/**
 * API request types
 */
export interface FetchConversationRequest {
  applicationId: string;
  organizationId: string;
  pageSize?: number;
  page?: number;
  filters?: ConversationFilter[];
  searchQuery?: string;
}

export type ConversationFilter =
  | "all"
  | "unread"
  | "assigned_to_me"
  | "waiting_for_applicant"
  | "waiting_for_staff"
  | "archived"
  | "has_attachments"
  | "has_document_request"
  | "has_decision";

/**
 * API response types
 */
export interface FetchConversationResponse {
  success: boolean;
  data?: ConversationData;
  error?: string;
  metadata?: {
    responseTime: number;
    cached: boolean;
  };
}

/**
 * Mark message as read request
 */
export interface MarkAsReadRequest {
  applicationId: string;
  organizationId: string;
  messageIds?: string[]; // If empty, mark all as read
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  applicationId: string;
  organizationId: string;
  mode: CommunicationMode;
  content: string;
  recipients: string[];
  subject?: string;
  attachments?: Attachment[];
  replyToId?: string;
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  success: boolean;
  message?: TimelineItem;
  error?: string;
}

/**
 * Sidebar tab type
 */
export type SidebarTab = "context" | "documents" | "decisions";

/**
 * Responsive layout configuration
 */
export interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  sidebarCollapsed: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
}
