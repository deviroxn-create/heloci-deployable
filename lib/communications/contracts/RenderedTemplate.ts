/**
 * RENDERED TEMPLATE CONTRACT
 * ==========================
 * Immutable rendered template ready to send.
 * K1.C0 — Communication Contract Certification
 */

import type { RenderedTemplate as IRenderedTemplate, CommunicationChannel } from "./CommunicationTypes";

/**
 * RenderedTemplate Factory - Creates immutable rendered templates
 */
export class RenderedTemplateFactory {
  static create(data: {
    templateId: string;
    subject?: string;
    body: string;
    html?: string;
    plainText?: string;
    channel: CommunicationChannel;
    variables?: {
      substituted?: Record<string, unknown>;
      missing?: string[];
    };
  }): Readonly<IRenderedTemplate> {
    // Validate required fields
    if (!data.templateId) throw new Error("RenderedTemplate.templateId is required");
    if (!data.body) throw new Error("RenderedTemplate.body is required");

    // Channel-specific validation
    if (data.channel === "email" && !data.subject) {
      throw new Error("RenderedTemplate.subject is required for email channel");
    }

    const substituted = data.variables?.substituted || {};
    const missing = data.variables?.missing || [];

    // Create immutable rendered template
    return Object.freeze({
      templateId: data.templateId,
      subject: data.subject,
      body: data.body,
      html: data.html,
      plainText: data.plainText,
      variables: Object.freeze({
        substituted: Object.freeze(substituted),
        missing: Object.freeze(missing),
      }),
    }) as Readonly<IRenderedTemplate>;
  }
}

/**
 * RenderedTemplate Validator - Validates rendered template data
 */
export class RenderedTemplateValidator {
  static validate(template: any, channel?: CommunicationChannel): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template) {
      errors.push("RenderedTemplate is required");
      return { valid: false, errors };
    }

    // Required fields
    if (!template.templateId) errors.push("RenderedTemplate.templateId is required");
    if (!template.body) errors.push("RenderedTemplate.body is required");

    // Type checks
    if (template.templateId && typeof template.templateId !== "string") {
      errors.push("RenderedTemplate.templateId must be string");
    }
    if (template.subject && typeof template.subject !== "string") {
      errors.push("RenderedTemplate.subject must be string");
    }
    if (template.body && typeof template.body !== "string") {
      errors.push("RenderedTemplate.body must be string");
    }
    if (template.html && typeof template.html !== "string") {
      errors.push("RenderedTemplate.html must be string");
    }
    if (template.plainText && typeof template.plainText !== "string") {
      errors.push("RenderedTemplate.plainText must be string");
    }

    // Channel-specific validation
    if (channel === "email" && !template.subject) {
      errors.push("RenderedTemplate.subject is required for email channel");
    }

    // Body must not be empty
    if (template.body && template.body.trim() === "") {
      errors.push("RenderedTemplate.body cannot be empty");
    }

    // Variables validation
    if (template.variables) {
      if (template.variables.substituted && typeof template.variables.substituted !== "object") {
        errors.push("RenderedTemplate.variables.substituted must be object");
      }
      if (template.variables.missing && !Array.isArray(template.variables.missing)) {
        errors.push("RenderedTemplate.variables.missing must be array");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate variable substitution
   */
  static validateVariables(template: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template) return { valid: false, errors: ["Template is required"], warnings: [] };

    // Check for missing variables
    if (template.variables?.missing && template.variables.missing.length > 0) {
      warnings.push(
        `Template has missing variables: ${template.variables.missing.join(", ")}. This may result in incomplete content.`
      );
    }

    // Check body for unreplaced variables (double braces pattern)
    const unreplacedPattern = /\{\{[\w.]+\}\}/;
    if (template.body && unreplacedPattern.test(template.body)) {
      const matches = template.body.match(/\{\{[\w.]+\}\}/g) || [];
      warnings.push(`Body contains unreplaced variables: ${matches.join(", ")}`);
    }

    if (template.html && unreplacedPattern.test(template.html)) {
      const matches = template.html.match(/\{\{[\w.]+\}\}/g) || [];
      warnings.push(`HTML contains unreplaced variables: ${matches.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template content length
   */
  static validateLength(template: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template) return { valid: false, errors: ["Template is required"], warnings: [] };

    // Check body length
    if (template.body) {
      if (template.body.length > 5000) {
        warnings.push(`Body is very long (${template.body.length} chars), may cause display issues`);
      }
      if (template.body.length === 0) {
        errors.push("Body is empty");
      }
    }

    // Check subject length (for email)
    if (template.subject && template.subject.length > 200) {
      warnings.push(`Subject is very long (${template.subject.length} chars), may be truncated in some email clients`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
