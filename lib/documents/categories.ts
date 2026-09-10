/**
 * Document Categories and Requirements
 * 
 * Defines all document types organized by category,
 * including which are required/optional and conditional requirements.
 */

export type DocumentCategory = 
  | 'identity'
  | 'income'
  | 'banking'
  | 'housing'
  | 'utility'
  | 'benefits'
  | 'special';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  required: boolean;
  conditionalRequired?: {
    field: string;
    value: any;
  };
  acceptedFormats: string[];
  maxSizeMB: number;
  examples?: string[];
}

export type ApplicantIdentityDocument = "national_id" | "visa" | "drivers_license";

export const APPLICANT_IDENTITY_DOCUMENTS: Record<ApplicantIdentityDocument, {
  label: string;
  frontId: string;
  backId: string;
}> = {
  national_id: { label: "National ID card", frontId: "national_id_front", backId: "national_id_back" },
  visa: { label: "Visa", frontId: "visa_front", backId: "visa_back" },
  drivers_license: { label: "Driver's license", frontId: "drivers_license_front", backId: "drivers_license_back" },
};

export const APPLICANT_INCOME_DOCUMENTS = {
  w2: { label: "W-2", id: "w2" },
  ein: { label: "EIN documentation", id: "ein_documentation" },
} as const;

export const APPLICANT_UTILITY_DOCUMENT = "utility_bill";

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, {
  label: string;
  description: string;
  icon: string;
}> = {
  identity: {
    label: 'Identity Documents',
    description: 'Government-issued identification',
    icon: '🪪',
  },
  income: {
    label: 'Income Verification',
    description: 'Proof of income and employment',
    icon: '💰',
  },
  banking: {
    label: 'Banking Information',
    description: 'Bank statements and account verification',
    icon: '🏦',
  },
  housing: {
    label: 'Housing History',
    description: 'Current and past housing documentation',
    icon: '🏠',
  },
  utility: {
    label: 'Utility Bills',
    description: 'Recent utility bills for address verification',
    icon: '⚡',
  },
  benefits: {
    label: 'Benefits Documentation',
    description: 'Government assistance and benefits',
    icon: '📋',
  },
  special: {
    label: 'Special Program Documents',
    description: 'Program-specific documentation',
    icon: '✦',
  },
};

export const DOCUMENT_TYPES: DocumentType[] = [
  ...Object.values(APPLICANT_IDENTITY_DOCUMENTS).flatMap((document) => [
    {
      id: document.frontId,
      name: `${document.label} (front)`,
      description: `Front of selected ${document.label.toLowerCase()}`,
      category: "identity" as const,
      required: false,
      acceptedFormats: ["image/*", "application/pdf"],
      maxSizeMB: 5,
    },
    {
      id: document.backId,
      name: `${document.label} (back)`,
      description: `Back of selected ${document.label.toLowerCase()}`,
      category: "identity" as const,
      required: false,
      acceptedFormats: ["image/*", "application/pdf"],
      maxSizeMB: 5,
    },
  ]),
  {
    id: APPLICANT_UTILITY_DOCUMENT,
    name: "Utility bill",
    description: "Recent utility bill for address verification",
    category: "utility",
    required: false,
    acceptedFormats: ["image/*", "application/pdf"],
    maxSizeMB: 10,
  },
  {
    id: APPLICANT_INCOME_DOCUMENTS.w2.id,
    name: APPLICANT_INCOME_DOCUMENTS.w2.label,
    description: "W-2 income documentation",
    category: "income",
    required: false,
    acceptedFormats: ["image/*", "application/pdf"],
    maxSizeMB: 10,
  },
  {
    id: APPLICANT_INCOME_DOCUMENTS.ein.id,
    name: APPLICANT_INCOME_DOCUMENTS.ein.label,
    description: "EIN documentation for self-employment or business income",
    category: "income",
    required: false,
    acceptedFormats: ["image/*", "application/pdf"],
    maxSizeMB: 10,
  },
  // Identity Documents
  {
    id: 'drivers_license',
    name: "Driver's License or State ID",
    description: 'Valid government-issued photo ID',
    category: 'identity',
    required: true,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 5,
    examples: ["Driver's license (front and back)", 'State ID card', 'Passport'],
  },
  {
    id: 'passport',
    name: 'Passport or Visa',
    description: 'Valid passport or visa for international residents',
    category: 'identity',
    required: false,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 5,
    examples: ['Passport', 'Valid visa'],
  },

  // Income Verification
  {
    id: 'pay_stubs',
    name: 'Pay Stubs or Income Verification',
    description: 'Recent pay stubs (most recent 2 months), tax documentation, or benefit statement',
    category: 'income',
    required: true,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 10,
    examples: ['Last 2-3 pay stubs', 'Recent tax return (1040)', 'Benefit statement'],
  },

  // Banking
  {
    id: 'bank_statements',
    name: 'Bank Statements',
    description: 'Most recent 2 months of bank statements',
    category: 'banking',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },

  // Housing
  {
    id: 'current_lease',
    name: 'Lease or Proof of Address',
    description: 'Current lease agreement, utility bill, or other proof of address',
    category: 'housing',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
    examples: ['Rental lease', 'Utility bill', 'Mortgage statement'],
  },

  // Benefits
  {
    id: 'disability_benefits',
    name: 'Disability Benefits Documentation',
    description: 'SSI/SSDI award letter or disability documentation',
    category: 'benefits',
    required: false,
    conditionalRequired: {
      field: 'personal.isDisabilityAffected',
      value: true,
    },
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },

  // Special Program Documents
  {
    id: 'veteran_dd214',
    name: 'DD-214 (Veteran Discharge)',
    description: 'Certificate of Release or Discharge from Active Duty',
    category: 'special',
    required: false,
    conditionalRequired: {
      field: 'personal.isVeteran',
      value: true,
    },
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
];

/**
 * Get required documents based on applicant profile
 */
export function getRequiredDocuments(profile: Record<string, unknown>): DocumentType[] {
  return DOCUMENT_TYPES.filter(doc => {
    // Always required
    if (doc.required) return true;

    // Conditionally required
    if (doc.conditionalRequired) {
      const fieldValue = profile[doc.conditionalRequired.field];
      return fieldValue === doc.conditionalRequired.value || 
             String(fieldValue) === String(doc.conditionalRequired.value) ||
             (fieldValue === 'true' && doc.conditionalRequired.value === true);
    }

    return false;
  });
}

/**
 * Get optional documents
 */
export function getOptionalDocuments(): DocumentType[] {
  return DOCUMENT_TYPES.filter(doc => !doc.required && !doc.conditionalRequired);
}

/**
 * Get documents by category
 */
export function getDocumentsByCategory(category: DocumentCategory): DocumentType[] {
  return DOCUMENT_TYPES.filter(doc => doc.category === category);
}
