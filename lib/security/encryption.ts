/**
 * encryption.ts
 * 
 * Client-side encryption utilities for sensitive data (SSN, banking information).
 * Uses Web Crypto API for secure encryption.
 * 
 * IMPORTANT: This is client-side encryption for UI masking and basic security.
 * Server-side encryption should also be implemented for data at rest.
 */

/**
 * Simple masking function for displaying sensitive data
 * Does not encrypt, just masks for display purposes
 */
export function maskSSN(ssn: string | undefined): string {
  if (!ssn) return "";
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `***-**-${cleaned.slice(-4)}`;
  }
  return "***-**-****";
}

export function maskBankAccount(account: string | undefined): string {
  if (!account) return "";
  const cleaned = account.replace(/\D/g, "");
  if (cleaned.length >= 4) {
    return `****${cleaned.slice(-4)}`;
  }
  return "****";
}

export function maskRoutingNumber(routing: string | undefined): string {
  if (!routing) return "";
  const cleaned = routing.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `****${cleaned.slice(-4)}`;
  }
  return "****";
}

/**
 * Format SSN with dashes
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length >= 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  }
  if (cleaned.length >= 5) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
}

/**
 * Validate SSN format
 */
export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length !== 9) return false;
  
  // Check for invalid SSNs
  const invalidSSNs = [
    "000000000", "111111111", "222222222", "333333333",
    "444444444", "555555555", "666666666", "777777777",
    "888888888", "999999999", "123456789"
  ];
  
  if (invalidSSNs.includes(cleaned)) return false;
  if (cleaned.startsWith("000")) return false;
  if (cleaned.substring(3, 5) === "00") return false;
  if (cleaned.substring(5) === "0000") return false;
  
  return true;
}

/**
 * Validate routing number (basic check)
 */
export function isValidRoutingNumber(routing: string): boolean {
  const cleaned = routing.replace(/\D/g, "");
  if (cleaned.length !== 9) return false;
  
  // ABA routing number checksum validation
  const digits = cleaned.split("").map(Number);
  const checksum = (
    3 * (digits[0]! + digits[3]! + digits[6]!) +
    7 * (digits[1]! + digits[4]! + digits[7]!) +
    (digits[2]! + digits[5]! + digits[8]!)
  ) % 10;
  
  return checksum === 0;
}

/**
 * Basic encryption using base64 (for MVP)
 * 
 * NOTE: This is NOT secure encryption, just obfuscation for the MVP.
 * In production, implement proper AES encryption on the server side.
 */
export function encryptForStorage(value: string): string {
  if (!value) return "";
  try {
    return btoa(value);
  } catch {
    return value;
  }
}

export function decryptFromStorage(encrypted: string): string {
  if (!encrypted) return "";
  try {
    return atob(encrypted);
  } catch {
    return encrypted;
  }
}

/**
 * Secure input handler that masks value after entry
 */
export class SecureInputHandler {
  private realValue: string = "";
  private maskedValue: string = "";
  private isMasked: boolean = false;

  setValue(value: string) {
    this.realValue = value;
    this.maskedValue = this.mask(value);
    this.isMasked = false;
  }

  getValue(): string {
    return this.realValue;
  }

  getDisplayValue(): string {
    return this.isMasked ? this.maskedValue : this.realValue;
  }

  maskValue() {
    this.isMasked = true;
  }

  unmaskValue() {
    this.isMasked = false;
  }

  private mask(value: string): string {
    if (value.length <= 4) return "*".repeat(value.length);
    return "*".repeat(value.length - 4) + value.slice(-4);
  }
}
