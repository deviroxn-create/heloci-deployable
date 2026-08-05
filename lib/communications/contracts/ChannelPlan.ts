/**
 * CHANNEL PLAN CONTRACT
 * ====================
 * Immutable channel plan for how a recipient receives a communication.
 * K1.C0 — Communication Contract Certification
 */

import type { CommunicationChannel, ChannelPlan as IChannelPlan } from "./CommunicationTypes";

/**
 * ChannelPlan Factory - Creates immutable channel plans
 */
export class ChannelPlanFactory {
  static create(data: {
    recipientId: string;
    primary: CommunicationChannel;
    fallbacks?: CommunicationChannel[];
    disabled?: CommunicationChannel[];
    priority?: "critical" | "high" | "normal" | "low";
  }): Readonly<IChannelPlan> {
    // Validate required fields
    if (!data.recipientId) throw new Error("ChannelPlan.recipientId is required");
    if (!data.primary) throw new Error("ChannelPlan.primary is required");

    // Ensure fallbacks don't include primary
    const fallbacks = (data.fallbacks || []).filter((f) => f !== data.primary);

    // Create immutable channel plan
    return Object.freeze({
      recipientId: data.recipientId,
      primary: data.primary,
      fallbacks: Object.freeze(fallbacks),
      disabled: data.disabled ? Object.freeze(data.disabled) : undefined,
      priority: data.priority || "normal",
    }) as Readonly<IChannelPlan>;
  }

  /**
   * Create batch of channel plans
   */
  static createBatch(plans: Parameters<typeof ChannelPlanFactory.create>[0][]): readonly Readonly<IChannelPlan>[] {
    return Object.freeze(plans.map((p) => ChannelPlanFactory.create(p)));
  }

  /**
   * Create channel plan for multiple recipients with same config
   */
  static createForRecipients(
    recipientIds: string[],
    config: {
      primary: CommunicationChannel;
      fallbacks?: CommunicationChannel[];
      disabled?: CommunicationChannel[];
      priority?: "critical" | "high" | "normal" | "low";
    }
  ): readonly Readonly<IChannelPlan>[] {
    return Object.freeze(
      recipientIds.map((id) =>
        ChannelPlanFactory.create({
          recipientId: id,
          ...config,
        })
      )
    );
  }
}

/**
 * ChannelPlan Validator - Validates channel plan data
 */
export class ChannelPlanValidator {
  static validate(plan: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!plan) {
      errors.push("ChannelPlan is required");
      return { valid: false, errors };
    }

    // Required fields
    if (!plan.recipientId) errors.push("ChannelPlan.recipientId is required");
    if (!plan.primary) errors.push("ChannelPlan.primary is required");

    // Type checks
    if (plan.recipientId && typeof plan.recipientId !== "string") errors.push("ChannelPlan.recipientId must be string");
    if (plan.primary && typeof plan.primary !== "string") errors.push("ChannelPlan.primary must be string");
    if (plan.priority && typeof plan.priority !== "string") errors.push("ChannelPlan.priority must be string");

    // Valid priority values
    const validPriorities = ["critical", "high", "normal", "low"];
    if (plan.priority && !validPriorities.includes(plan.priority)) {
      errors.push(`ChannelPlan.priority must be one of: ${validPriorities.join(", ")}`);
    }

    // Fallbacks validation
    if (plan.fallbacks) {
      if (!Array.isArray(plan.fallbacks)) {
        errors.push("ChannelPlan.fallbacks must be array");
      } else if (plan.fallbacks.includes(plan.primary)) {
        errors.push("ChannelPlan.fallbacks cannot include primary channel");
      }
    }

    // Disabled validation
    if (plan.disabled) {
      if (!Array.isArray(plan.disabled)) {
        errors.push("ChannelPlan.disabled must be array");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate batch of channel plans
   */
  static validateBatch(plans: any[]): {
    valid: boolean;
    errors: string[];
    planErrors: Record<string, string[]>;
  } {
    const planErrors: Record<string, string[]> = {};
    let hasErrors = false;

    plans.forEach((p) => {
      const result = ChannelPlanValidator.validate(p);
      if (!result.valid) {
        planErrors[p?.recipientId || "unknown"] = result.errors;
        hasErrors = true;
      }
    });

    return {
      valid: !hasErrors,
      errors: hasErrors ? ["One or more channel plans failed validation"] : [],
      planErrors,
    };
  }

  /**
   * Validate that all plan recipients exist in recipient list
   */
  static validateRecipientCoverage(
    plans: any[],
    recipientIds: Set<string>
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const planRecipients = new Set(plans.map((p) => p.recipientId));

    // Check for plans with non-existent recipients
    planRecipients.forEach((id) => {
      if (!recipientIds.has(id)) {
        errors.push(`ChannelPlan references non-existent recipient: ${id}`);
      }
    });

    // Check for missing plans
    recipientIds.forEach((id) => {
      if (!planRecipients.has(id)) {
        errors.push(`No channel plan for recipient: ${id}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
