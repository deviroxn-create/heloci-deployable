export type EmailTemplateName = "welcome" | "application_received" | "application_status";

export interface EmailPayload {
  to: string;
  template: EmailTemplateName;
  data: Record<string, any>;
}
