export type CaseTabId = "profile" | "application" | "eligibility" | "checklist" | "documents" | "decision" | "timeline" | "audit" | "notes" | "communication";

const validCaseTabs: CaseTabId[] = [
  "communication",
  "profile",
  "application",
  "eligibility",
  "checklist",
  "documents",
  "decision",
  "timeline",
  "audit",
  "notes",
];

export function resolveActiveTab(value: string | null | undefined): CaseTabId {
  if (typeof value === "string" && validCaseTabs.includes(value as CaseTabId)) {
    return value as CaseTabId;
  }

  return "profile";
}
