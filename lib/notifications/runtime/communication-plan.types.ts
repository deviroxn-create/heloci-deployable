import type { AudienceRole } from "./audience.types";

export type CommunicationChannel = "email" | "telegram" | "internal";

export interface CommunicationPlan {
  event: string;
  audienceRole: AudienceRole;
  recipientId?: string;
  preferredChannel: CommunicationChannel;
  priority: number;
  metadata?: Record<string, unknown>;
}
