import type { CommunicationChannel } from "./communication-plan.types";
import type { AudienceRole } from "./audience.types";

export interface DispatchRequest {
  event: string;
  audienceRole: AudienceRole;
  channel: CommunicationChannel;
  recipientId?: string;
  templateKey: string | null;
  metadata?: Record<string, unknown>;
}
