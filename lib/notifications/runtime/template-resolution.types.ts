import type { AudienceRole } from "./audience.types";
import type { CommunicationChannel } from "./communication-plan.types";

export interface TemplateResolution {
  event: string;
  audienceRole: AudienceRole;
  channel: CommunicationChannel;
  templateKey: string;
  locale?: string;
  version?: number;
}

export interface UnresolvedTemplateResolution {
  event: string;
  audienceRole: AudienceRole;
  channel: CommunicationChannel;
  templateKey: null;
  locale?: string;
  version?: number;
}
