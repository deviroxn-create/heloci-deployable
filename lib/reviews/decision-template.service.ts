/**
 * Decision Template Service
 * 
 * Manages creation, versioning, and organization of decision templates.
 * All operations enforce organization boundaries.
 * Request-level authorization is handled at API entry points.
 */

import { prisma } from "@/lib/prisma/client";
import type { DecisionType } from "./decision.types";

export interface CreateDecisionTemplateInput {
  organizationId: string;
  userId: string;
  name: string;
  category: DecisionType;
  subject?: string;
  body: string;
  variables?: string[];
  isDefault?: boolean;
}

export interface UpdateDecisionTemplateInput {
  templateId: string;
  organizationId: string;
  userId: string;
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isDefault?: boolean;
}

export interface SearchDecisionTemplatesInput {
  organizationId: string;
  userId: string;
  category?: DecisionType;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface DecisionTemplateRecord {
  id: string;
  organizationId: string;
  name: string;
  category: DecisionType;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
}

/**
 * Create a new decision template
 */
export async function createDecisionTemplate(
  input: CreateDecisionTemplateInput
): Promise<{ success: boolean; template?: DecisionTemplateRecord; error?: string }> {
  try {
    // Authorization is handled at the API route level.
    // Service retains only organization ownership/business logic.
    // Extract variables from body if not provided
    let variables = input.variables || extractTemplateVariables(input.body);

    // Create the template
    const template = await prisma.decisionTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        category: input.category,
        subject: input.subject || "",
        body: input.body,
        variables: variables,
        isDefault: input.isDefault || false,
        createdBy: input.userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        entity: "DecisionTemplate",
        action: "created",
        meta: {
          templateId: template.id,
          name: template.name,
          category: template.category,
        },
      },
    });

    return {
      success: true,
      template: formatTemplate(template),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create template",
    };
  }
}

/**
 * Update an existing decision template
 */
export async function updateDecisionTemplate(
  input: UpdateDecisionTemplateInput
): Promise<{ success: boolean; template?: DecisionTemplateRecord; error?: string }> {
  try {
    // Fetch the template and verify organization ownership
    const template = await prisma.decisionTemplate.findUnique({
      where: { id: input.templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.organizationId !== input.organizationId) {
      return { success: false, error: "Template does not belong to this organization" };
    }

    // Authorization is handled at the API route level.
    // Extract variables if body changed
    let variables = template.variables as string[];
    if (input.body) {
      variables = input.variables || extractTemplateVariables(input.body);
    }

    // Update the template
    const updated = await prisma.decisionTemplate.update({
      where: { id: input.templateId },
      data: {
        name: input.name || template.name,
        subject: input.subject !== undefined ? input.subject : template.subject,
        body: input.body || template.body,
        variables: (variables as any) || null,
        isDefault: input.isDefault !== undefined ? input.isDefault : template.isDefault,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        entity: "DecisionTemplate",
        action: "updated",
        meta: {
          templateId: updated.id,
          changes: {
            name: input.name ? template.name : undefined,
            body: input.body ? "modified" : undefined,
            isDefault: input.isDefault !== undefined ? input.isDefault : undefined,
          },
        },
      },
    });

    return {
      success: true,
      template: formatTemplate(updated),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update template",
    };
  }
}

/**
 * Archive a template (soft delete)
 */
export async function archiveDecisionTemplate(
  templateId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = await prisma.decisionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.organizationId !== organizationId) {
      return { success: false, error: "Template does not belong to this organization" };
    }

    // Authorization is handled at the API route level.
    // Archive the template
    await prisma.decisionTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        entity: "DecisionTemplate",
        action: "archived",
        meta: { templateId, templateName: template.name },
      },
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to archive template",
    };
  }
}

/**
 * Restore an archived template
 */
export async function restoreDecisionTemplate(
  templateId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = await prisma.decisionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.organizationId !== organizationId) {
      return { success: false, error: "Template does not belong to this organization" };
    }

    // Authorization is handled at the API route level.
    // Restore the template
    await prisma.decisionTemplate.update({
      where: { id: templateId },
      data: { isActive: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        entity: "DecisionTemplate",
        action: "restored",
        meta: { templateId, templateName: template.name },
      },
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to restore template",
    };
  }
}

/**
 * Duplicate a template
 */
export async function duplicateDecisionTemplate(
  templateId: string,
  organizationId: string,
  userId: string,
  newName?: string
): Promise<{ success: boolean; template?: DecisionTemplateRecord; error?: string }> {
  try {
    const template = await prisma.decisionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.organizationId !== organizationId) {
      return { success: false, error: "Template does not belong to this organization" };
    }

    // Authorization is handled at the API route level.
    // Create duplicate
    const duplicate = await prisma.decisionTemplate.create({
      data: {
        organizationId,
        name: newName || `${template.name} (Copy)`,
        category: template.category,
        subject: template.subject,
        body: template.body,
        variables: (template.variables as any) || null,
        isDefault: false,
        isActive: true,
        createdBy: userId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        entity: "DecisionTemplate",
        action: "duplicated",
        meta: {
          originalTemplateId: template.id,
          newTemplateId: duplicate.id,
          newName: duplicate.name,
        },
      },
    });

    return {
      success: true,
      template: formatTemplate(duplicate),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to duplicate template",
    };
  }
}

/**
 * Search and filter templates
 */
export async function searchDecisionTemplates(
  input: SearchDecisionTemplatesInput
): Promise<{ success: boolean; templates?: DecisionTemplateRecord[]; total?: number; error?: string }> {
  try {
    // Authorization is handled at the API route level.

    // Build where clause
    const where: any = {
      organizationId: input.organizationId,
    };

    if (input.category) {
      where.category = input.category;
    }

    if (input.isActive !== undefined) {
      where.isActive = input.isActive;
    }

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { body: { contains: input.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.decisionTemplate.count({ where });

    // Get templates with pagination
    const templates = await prisma.decisionTemplate.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      take: input.limit || 50,
      skip: input.offset || 0,
    });

    return {
      success: true,
      templates: templates.map(formatTemplate),
      total,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to search templates",
    };
  }
}

/**
 * Get a single template by ID
 */
export async function getDecisionTemplate(
  templateId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; template?: DecisionTemplateRecord; error?: string }> {
  try {
    // Authorization is handled at the API route level.

    const template = await prisma.decisionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (template.organizationId !== organizationId) {
      return { success: false, error: "Template does not belong to this organization" };
    }

    return {
      success: true,
      template: formatTemplate(template),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch template",
    };
  }
}

/**
 * Get default templates for a decision type
 */
export async function getDefaultDecisionTemplate(
  organizationId: string,
  category: DecisionType,
  userId: string
): Promise<{ success: boolean; template?: DecisionTemplateRecord; error?: string }> {
  try {
    // Authorization is handled at the API route level.

    const template = await prisma.decisionTemplate.findFirst({
      where: {
        organizationId,
        category,
        isDefault: true,
        isActive: true,
      },
    });

    if (!template) {
      return { success: false, error: "No default template found for this category" };
    }

    return {
      success: true,
      template: formatTemplate(template),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch default template",
    };
  }
}

/**
 * Extract variables from template body
 * Variables are marked with {{variable_name}}
 */
export function extractTemplateVariables(body: string): string[] {
  const matches = body.match(/\{\{\s*([\w.]+)\s*\}\}/g) || [];
  const variables = matches.map((match) =>
    match.replace(/\{\{\s*/, "").replace(/\s*\}\}/, "")
  );
  return Array.from(new Set(variables.filter(Boolean)));
}

/**
 * Render template with variable substitution
 */
export function renderDecisionTemplate(
  template: string,
  variables: Record<string, any>
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value == null ? `{{${key}}}` : String(value);
  });
}

/**
 * Format template for API response
 */
function formatTemplate(template: any): DecisionTemplateRecord {
  return {
    id: template.id,
    organizationId: template.organizationId,
    name: template.name,
    category: template.category as DecisionType,
    subject: template.subject || undefined,
    body: template.body,
    variables: (template.variables as string[]) || [],
    isActive: template.isActive,
    isDefault: template.isDefault,
    createdBy: template.createdBy,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
