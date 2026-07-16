export type NotificationDeliveryStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "CANCELLED";

export interface NotificationLogRecord {
  id: string;
  eventName: string;
  channel: string;
  recipient?: string | null;
  sender?: string | null;
  subject?: string | null;
  messagePreview?: string | null;
  templateUsed?: string | null;
  payload?: Record<string, unknown> | null;
  provider?: string | null;
  providerResponse?: Record<string, unknown> | null;
  deliveryStatus: NotificationDeliveryStatus;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: Date;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
}

export type NotificationTemplateStatus = "DRAFT" | "PUBLISHED";

export interface NotificationTemplateRecord {
  id: string;
  name: string;
  eventName: string;
  channel: string;
  locale: string;
  title: string;
  subject: string;
  html: string;
  plainText: string;
  variables?: string[] | null;
  status: NotificationTemplateStatus;
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
