/**
 * RECIPIENT CONTRACT
 * ==================
 * Immutable recipient representation in the communication runtime.
 * K1.C0 — Communication Contract Certification
 */

import type { AudienceRole, CommunicationChannel, RecipientPreferences } from "./CommunicationTypes";

/**
 * Recipient Factory - Creates immutable recipient objects
 */
export class RecipientFactory {
  static create(data: {
    id: string;
    email: string;
    name?: string;
    role: AudienceRole;
    organizationId: string;
    preferences?: RecipientPreferences;
    metadata?: Record<string, unknown>;
  }) {
    // Validate required fields
    if (!data.id) throw new Error("Recipient.id is required");
    if (!data.email) throw new Error("Recipient.email is required");
    if (!data.role) throw new Error("Recipient.role is required");
    if (!data.organizationId) throw new Error("Recipient.organizationId is required");

    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error(`Invalid email format: ${data.email}`);
    }

    // Create immutable recipient
    return Object.freeze({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      organizationId: data.organizationId,
      preferences: data.preferences ? Object.freeze(data.preferences) : undefined,
      metadata: data.metadata ? Object.freeze(data.metadata) : undefined,
    } as const) as Readonly<typeof data>;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create a batch of recipients
   */
  static createBatch(recipients: Parameters<typeof RecipientFactory.create>[0][]): readonly Readonly<typeof recipients[0]>[] {
    return Object.freeze(recipients.map((r) => RecipientFactory.create(r)));
  }

  /**
   * Deduplicate recipients by email (takes first occurrence)
   */
  static deduplicateByEmail(recipients: readonly any[]): readonly any[] {
    const seen = new Set<string>();
    return recipients.filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });
  }

  /**
   * Deduplicate recipients by ID (takes first occurrence)
   */
  static deduplicateById(recipients: readonly any[]): readonly any[] {
    const seen = new Set<string>();
    return recipients.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }
}

/**
 * Recipient Validator - Validates recipient data
 */
export class RecipientValidator {
  static validate(recipient: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!recipient) {
      errors.push("Recipient is required");
      return { valid: false, errors };
    }

    // Required fields
    if (!recipient.id) errors.push("Recipient.id is required");
    if (!recipient.email) errors.push("Recipient.email is required");
    if (!recipient.role) errors.push("Recipient.role is required");
    if (!recipient.organizationId) errors.push("Recipient.organizationId is required");

    // Email validation
    if (recipient.email && !this.isValidEmail(recipient.email)) {
      errors.push(`Invalid email format: ${recipient.email}`);
    }

    // Type checks
    if (recipient.id && typeof recipient.id !== "string") errors.push("Recipient.id must be string");
    if (recipient.email && typeof recipient.email !== "string") errors.push("Recipient.email must be string");
    if (recipient.role && typeof recipient.role !== "string") errors.push("Recipient.role must be string");
    if (recipient.organizationId && typeof recipient.organizationId !== "string")
      errors.push("Recipient.organizationId must be string");
    if (recipient.name && typeof recipient.name !== "string") errors.push("Recipient.name must be string");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate batch of recipients
   */
  static validateBatch(recipients: any[]): {
    valid: boolean;
    errors: string[];
    recipientErrors: Record<string, string[]>;
  } {
    const recipientErrors: Record<string, string[]> = {};
    let hasErrors = false;

    recipients.forEach((r) => {
      const result = RecipientValidator.validate(r);
      if (!result.valid) {
        recipientErrors[r?.id || "unknown"] = result.errors;
        hasErrors = true;
      }
    });

    return {
      valid: !hasErrors,
      errors: hasErrors ? ["One or more recipients failed validation"] : [],
      recipientErrors,
    };
  }
}
