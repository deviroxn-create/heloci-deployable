export type AudienceRole = "applicant" | "organization_admin" | "reviewer" | "case_worker" | "support" | "system";

export type AudienceRecipient =
  | { type: "user"; userId?: string; email?: string }
  | { type: "email"; email?: string }
  | { type: "system" };

export interface Audience {
  role: AudienceRole;
  name: string;
  recipient: AudienceRecipient;
}
