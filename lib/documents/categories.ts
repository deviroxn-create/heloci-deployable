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
    id: 'social_security_card',
    name: 'Social Security Card',
    description: 'Social Security card for all household members',
    category: 'identity',
    required: true,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 5,
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate',
    description: 'Birth certificate for all household members',
    category: 'identity',
    required: false,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 5,
  },

  // Income Verification
  {
    id: 'pay_stubs',
    name: 'Pay Stubs',
    description: 'Most recent 2 months of pay stubs',
    category: 'income',
    required: true,
    acceptedFormats: ['image/*', 'application/pdf'],
    maxSizeMB: 10,
    examples: ['Last 2-3 pay stubs', 'Employment verification letter'],
  },
  {
    id: 'tax_returns',
    name: 'Tax Returns',
    description: 'Most recent year tax return (1040)',
    category: 'income',
    required: true,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },
  {
    id: 'employment_letter',
    name: 'Employment Verification Letter',
    description: 'Letter from employer verifying employment and income',
    category: 'income',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
  {
    id: 'self_employment',
    name: 'Self-Employment Documentation',
    description: 'Business license, 1099s, or profit/loss statements',
    category: 'income',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },

  // Banking
  {
    id: 'bank_statements',
    name: 'Bank Statements',
    description: 'Most recent 2 months of bank statements',
    category: 'banking',
    required: true,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },
  {
    id: 'direct_deposit_form',
    name: 'Direct Deposit Authorization',
    description: 'Voided check or direct deposit form',
    category: 'banking',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },

  // Housing
  {
    id: 'current_lease',
    name: 'Current Lease Agreement',
    description: 'Copy of current rental agreement or lease',
    category: 'housing',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },
  {
    id: 'rent_receipts',
    name: 'Rent Receipts',
    description: 'Proof of rent payment for last 3 months',
    category: 'housing',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 10,
  },
  {
    id: 'landlord_reference',
    name: 'Landlord Reference Letter',
    description: 'Reference letter from current/previous landlord',
    category: 'housing',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
  {
    id: 'eviction_notice',
    name: 'Eviction Notice',
    description: 'Copy of eviction notice if applicable',
    category: 'housing',
    required: false,
    conditionalRequired: {
      field: 'housing.facingEviction',
      value: true,
    },
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },

  // Utility Bills
  {
    id: 'utility_bill',
    name: 'Utility Bill',
    description: 'Recent utility bill for address verification',
    category: 'utility',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
    examples: ['Electric bill', 'Gas bill', 'Water bill'],
  },

  // Benefits
  {
    id: 'snap_benefits',
    name: 'SNAP/Food Stamps',
    description: 'Proof of SNAP or food stamp benefits',
    category: 'benefits',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
  {
    id: 'disability_benefits',
    name: 'Disability Benefits',
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
  {
    id: 'unemployment',
    name: 'Unemployment Benefits',
    description: 'Unemployment benefit statement',
    category: 'benefits',
    required: false,
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },

  // Special Program Documents
  {
    id: 'veteran_dd214',
    name: 'DD-214 (Veteran)',
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
  {
    id: 'teacher_certificate',
    name: 'Teaching Certificate',
    description: 'Valid teaching license or certificate',
    category: 'special',
    required: false,
    conditionalRequired: {
      field: 'employment.isTeacher',
      value: true,
    },
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
  {
    id: 'healthcare_license',
    name: 'Healthcare Worker License',
    description: 'Professional healthcare license',
    category: 'special',
    required: false,
    conditionalRequired: {
      field: 'employment.isHealthcareWorker',
      value: true,
    },
    acceptedFormats: ['application/pdf', 'image/*'],
    maxSizeMB: 5,
  },
  {
    id: 'student_enrollment',
    name: 'Student Enrollment Verification',
    description: 'Proof of current enrollment in educational institution',
    category: 'special',
    required: false,
    conditionalRequired: {
      field: 'personal.isStudent',
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
