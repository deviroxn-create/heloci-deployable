/**
 * UNIFIED SEARCH SERVICE - Phase 1.6 Polish
 * 
 * Single search across all communication types:
 * - Messages
 * - Emails  
 * - Applications
 * - Applicant names
 * - Program names
 * - Staff names
 * - Document requests
 * - Subjects
 * 
 * Returns grouped results for UI rendering.
 */

import { prisma } from "@/lib/prisma/client";
import { CommunicationScope, getOperationOrganizationId } from "@/lib/communications/scope.service";

export interface SearchResult {
  type: "message" | "email" | "application" | "staff" | "program" | "document_request";
  id: string;
  title: string;
  subtitle?: string;
  preview?: string;
  metadata?: any;
  highlight?: string;
}

export interface UnifiedSearchResults {
  messages: SearchResult[];
  emails: SearchResult[];
  applications: SearchResult[];
  staff: SearchResult[];
  programs: SearchResult[];
  documentRequests: SearchResult[];
  totalCount: number;
}

/**
 * Unified search across all communication
 */
export async function searchCommunications(
  query: string,
  userId: string,
  scope: CommunicationScope,
  options?: {
    limit?: number;
  }
): Promise<UnifiedSearchResults> {
  if (!query || query.length < 2) {
    return {
      messages: [],
      emails: [],
      applications: [],
      staff: [],
      programs: [],
      documentRequests: [],
      totalCount: 0,
    };
  }

  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const limit = options?.limit ?? 10;
  const searchTerm = `%${query}%`;

  // Search all sources in parallel
  const [messages, emails, applications, staff, programs, documentRequests] = await Promise.all([
    // Search messages
    prisma.caseMessage.findMany({
      where: {
        conversation: {
          programApplication: {
            program: { organizationId }
          }
        },
        content: {
          contains: query,
          mode: "insensitive"
        }
      },
      include: {
        conversation: {
          include: {
            programApplication: {
              include: {
                user: true,
                program: true
              }
            }
          }
        },
        sender: true
      },
      take: limit
    }),

    // Search emails
    prisma.notificationLog.findMany({
      where: {
        channel: "email",
        user: { organizationId },
        OR: [
          { subject: { contains: query, mode: "insensitive" } },
          { recipient: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        user: true
      },
      take: limit
    }),

    // Search applications
    prisma.programApplication.findMany({
      where: {
        program: { organizationId },
        OR: [
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } }
        ]
      },
      include: {
        user: true,
        program: true
      },
      take: limit
    }),

    // Search staff
    prisma.organizationMember.findMany({
      where: {
        organizationId,
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        }
      },
      include: {
        user: true
      },
      take: limit
    }),

    // Search programs
    prisma.program.findMany({
      where: {
        organizationId,
        name: {
          contains: query,
          mode: "insensitive"
        }
      },
      take: limit
    }),

    // Search document requests
    prisma.documentRequest.findMany({
      where: {
        application: {
          program: { organizationId }
        },
        OR: [
          { documentType: { contains: query, mode: "insensitive" } },
          { status: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        application: {
          include: {
            user: true,
            program: true
          }
        },
        requestedByUser: true
      },
      take: limit
    })
  ]);

  // Map to unified results
  const results: UnifiedSearchResults = {
    messages: messages.map(msg => ({
      type: "message" as const,
      id: msg.id,
      title: msg.conversation.programApplication.user.name || msg.conversation.programApplication.user.email,
      subtitle: msg.conversation.programApplication.program.name || undefined,
      preview: msg.content.substring(0, 100),
      metadata: {
        applicationId: msg.conversation.programApplication.id,
        senderName: msg.sender.name,
        sentAt: msg.createdAt
      },
      highlight: msg.content.includes(query) ? msg.content : undefined
    })),

    emails: emails.map(email => ({
      type: "email" as const,
      id: email.id,
      title: email.subject || "No subject",
      subtitle: email.recipient || undefined,
      preview: email.messagePreview?.substring(0, 100),
      metadata: {
        recipient: email.recipient,
        status: email.deliveryStatus,
        sentAt: email.sentAt
      },
      highlight: email.subject?.includes(query) ? email.subject : undefined
    })),

    applications: applications.map(app => ({
      type: "application" as const,
      id: app.id,
      title: app.user.name || app.user.email,
      subtitle: app.program.name || undefined,
      preview: `Status: ${app.status}`,
      metadata: {
        applicantEmail: app.user.email,
        status: app.status,
        createdAt: app.createdAt
      }
    })),

    staff: staff.map(member => ({
      type: "staff" as const,
      id: member.user.id,
      title: member.user.name || member.user.email,
      subtitle: member.role,
      preview: member.user.email,
      metadata: {
        email: member.user.email,
        role: member.role
      }
    })),

    programs: programs.map(prog => ({
      type: "program" as const,
      id: prog.id,
      title: prog.name,
      subtitle: prog.description || undefined,
      preview: prog.description || "Program",
      metadata: {
        description: prog.description
      }
    })),

    documentRequests: documentRequests.map(dr => ({
      type: "document_request" as const,
      id: dr.id,
      title: dr.documentType,
      subtitle: dr.application.user.name || dr.application.user.email,
      preview: `Status: ${dr.status}`,
      metadata: {
        applicationId: dr.application.id,
        applicantName: dr.application.user.name,
        status: dr.status,
        expiresAt: dr.expiresAt
      }
    })),
    
    totalCount: 
      messages.length +
      emails.length +
      applications.length +
      staff.length +
      programs.length +
      documentRequests.length
  };

  return results;
}

/**
 * Get search suggestions as user types
 */
export async function getSearchSuggestions(
  query: string,
  userId: string,
  scope: CommunicationScope,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  // Get recent searches
  const suggestions = new Set<string>();

  // Recent application names
  const apps = await prisma.programApplication.findMany({
    where: {
      program: { organizationId },
      user: {
        name: {
          contains: query,
          mode: "insensitive"
        }
      }
    },
    select: { user: { select: { name: true } } },
    take: limit / 2
  });

  apps.forEach(app => {
    if (app.user.name) suggestions.add(app.user.name);
  });

  // Recent program names
  const programs = await prisma.program.findMany({
    where: {
      organizationId,
      name: {
        contains: query,
        mode: "insensitive"
      }
    },
    select: { name: true },
    take: limit / 2
  });

  programs.forEach(prog => {
    suggestions.add(prog.name);
  });

  return Array.from(suggestions).slice(0, limit);
}
