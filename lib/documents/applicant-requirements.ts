import {
  APPLICANT_IDENTITY_DOCUMENTS,
  type ApplicantIdentityDocument,
} from "./categories";

export interface ApplicantDocumentRecord {
  type: string;
}

export interface ApplicantDocumentRequirements {
  identityType?: ApplicantIdentityDocument;
  uploads: ApplicantDocumentRecord[];
}

export function getMissingApplicantDocuments({ identityType, uploads }: ApplicantDocumentRequirements): string[] {
  const uploaded = new Set(uploads.map((document) => document.type));
  const missing: string[] = [];

  if (!identityType || !APPLICANT_IDENTITY_DOCUMENTS[identityType]) {
    missing.push("Choose one identity document.");
  } else {
    const identity = APPLICANT_IDENTITY_DOCUMENTS[identityType];
    if (!uploaded.has(identity.frontId)) missing.push(`Upload the front of your ${identity.label.toLowerCase()}.`);
    if (!uploaded.has(identity.backId)) missing.push(`Upload the back of your ${identity.label.toLowerCase()}.`);
  }

  return missing;
}

export function hasCompleteApplicantDocuments(input: ApplicantDocumentRequirements): boolean {
  return getMissingApplicantDocuments(input).length === 0;
}
