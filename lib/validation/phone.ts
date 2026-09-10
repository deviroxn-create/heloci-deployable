/**
 * US Phone Number Validation and Formatting
 * 
 * Handles phone number input validation, formatting, and normalization
 * for the application.
 */

/**
 * Check if a string contains only numeric characters and common phone delimiters
 */
export function isPhoneCharacters(input: string): boolean {
  return /^[0-9\-\s()+]*$/.test(input);
}

/**
 * Extract only digits from a phone number string
 */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Check if extracted digits represent a valid US phone number (10 digits)
 */
export function isValidUSPhoneFormat(digits: string): boolean {
  return /^\d{10}$/.test(digits);
}

/**
 * Format digits as (555) 123-4567 for display
 */
export function formatPhoneForDisplay(digits: string): string {
  if (!digits) return '';
  const cleaned = extractDigits(digits);
  
  if (!isValidUSPhoneFormat(cleaned)) {
    return digits; // Return as-is if not exactly 10 digits
  }
  
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Normalize phone number to +1XXXXXXXXXX format for storage/API
 */
export function normalizePhoneForStorage(input: string): string {
  const digits = extractDigits(input);
  
  if (!isValidUSPhoneFormat(digits)) {
    return '';
  }
  
  return `+1${digits}`;
}

/**
 * Validate and normalize phone number input
 * Returns formatted display version and normalized storage version
 */
export function validateAndFormatPhone(input: string): {
  isValid: boolean;
  displayValue: string;
  storageValue: string;
  errorMessage?: string;
} {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      displayValue: '',
      storageValue: '',
      errorMessage: 'Phone number is required'
    };
  }

  if (!isPhoneCharacters(input)) {
    return {
      isValid: false,
      displayValue: input,
      storageValue: '',
      errorMessage: 'Phone number can only contain digits, spaces, hyphens, and parentheses'
    };
  }

  const digits = extractDigits(input);

  if (!isValidUSPhoneFormat(digits)) {
    const count = digits.length;
    return {
      isValid: false,
      displayValue: formatPhoneForDisplay(digits),
      storageValue: '',
      errorMessage: count === 0 
        ? 'Enter a phone number'
        : count < 10 
        ? `Enter a 10-digit US phone number (${count} digits entered)`
        : `Phone number must be 10 digits (${count} entered)`
    };
  }

  return {
    isValid: true,
    displayValue: formatPhoneForDisplay(digits),
    storageValue: normalizePhoneForStorage(digits)
  };
}

/**
 * Accept pasted phone numbers in common formats and return normalized version
 * Handles: 5551234567, (555) 123-4567, 555-123-4567, +1 555 123 4567
 */
export function parsePastedPhoneNumber(pastedText: string): string {
  const result = validateAndFormatPhone(pastedText);
  return result.displayValue;
}
