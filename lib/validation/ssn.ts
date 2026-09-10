/**
 * Social Security Number Validation and Formatting
 * 
 * Handles SSN input validation, formatting, and confirmation logic
 * Maintains masking for security while providing clear user feedback.
 */

/**
 * Extract only digits from SSN input
 */
export function extractSSNDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Check if SSN has exactly 9 digits
 */
export function isValidSSNLength(input: string): boolean {
  const digits = extractSSNDigits(input);
  return digits.length === 9;
}

/**
 * Format 9 digits as XXX-XX-XXXX for display
 */
export function formatSSNForDisplay(digits: string): string {
  const cleaned = extractSSNDigits(digits);
  
  if (cleaned.length !== 9) {
    return cleaned;
  }
  
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * Validate and normalize SSN input
 * Returns validation result with clear error messages
 */
export function validateSSN(input: string): {
  isValid: boolean;
  displayValue: string;
  errorMessage?: string;
  digitCount: number;
} {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      displayValue: '',
      errorMessage: 'Social Security Number is required',
      digitCount: 0
    };
  }

  const digits = extractSSNDigits(input);

  if (digits.length === 0) {
    return {
      isValid: false,
      displayValue: '',
      errorMessage: 'Enter a 9-digit Social Security Number',
      digitCount: 0
    };
  }

  if (digits.length < 9) {
    return {
      isValid: false,
      displayValue: formatSSNForDisplay(digits),
      errorMessage: `Enter a 9-digit Social Security Number (${digits.length} entered)`,
      digitCount: digits.length
    };
  }

  if (digits.length > 9) {
    return {
      isValid: false,
      displayValue: formatSSNForDisplay(digits.slice(0, 9)),
      errorMessage: `Social Security Number must be 9 digits (${digits.length} entered)`,
      digitCount: digits.length
    };
  }

  return {
    isValid: true,
    displayValue: formatSSNForDisplay(digits),
    digitCount: 9
  };
}

/**
 * Check if two SSN inputs match
 */
export function doSSNsMatch(ssn1: string, ssn2: string): boolean {
  const digits1 = extractSSNDigits(ssn1);
  const digits2 = extractSSNDigits(ssn2);
  
  return digits1 === digits2 && digits1.length === 9;
}

/**
 * Mask SSN for display purposes (show only last 4 digits)
 * Input is the raw/storage value, output is masked version
 */
export function maskSSNForDisplay(ssn: string): string {
  const digits = extractSSNDigits(ssn);
  
  if (digits.length !== 9) {
    return '•••-••-••••';
  }
  
  return `•••-••-${digits.slice(5)}`;
}
