/**
 * Recipient Types - Milestone 4
 * Reuses existing User, OrganizationMember, Department, Team models
 * No new database models created
 */

export interface RecipientUser {
  id: string;
  email: string;
  name: string | null;
  role: "APPLICANT" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
  organizationId: string | null;
  departmentId: string | null;
  jobTitle: string | null;
  teamId: string | null;
}

export interface RecipientOrgMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string; // "org_admin", "case_worker", "reviewer", "manager", etc.
  user: RecipientUser;
}

export interface RecipientDepartment {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
}

export interface RecipientTeam {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
}

export interface RecipientCard {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  organizationId: string;
  organizationName?: string;
  status?: "online" | "offline" | "idle";
  avatar?: string;
  isFavorite?: boolean;
  isRecent?: boolean;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  lastContactedAt?: Date;
  communicationCount?: number;
  // External recipient support (for manual email entry)
  isExternal?: boolean;
  userId?: string | null;
}

/**
 * Extended recipient type for sending
 * Includes both internal (userId present) and external (userId null) recipients
 * Used by NotificationService to handle mixed recipient lists
 */
export interface ComposerRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  userId: string | null; // null for external recipients
  isExternal: boolean;
}

export interface RecipientGroup {
  id: string;
  name: string;
  type: "department" | "team" | "role" | "custom";
  organizationId: string;
  recipientCount: number;
  members?: RecipientCard[];
  isExpanded?: boolean;
}

export interface RecipientSearchResult {
  users: RecipientCard[];
  groups: RecipientGroup[];
  recent: RecipientCard[];
  favorites: RecipientCard[];
  suggestions: RecipientCard[];
}

export interface RecipientSelection {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  type: "user" | "group";
  groupMembers?: string[]; // IDs of users if this is a group
}

export interface RecipientFilter {
  type?: "applicants" | "staff" | "admins" | "departments" | "groups" | "favorites" | "recent";
  department?: string;
  organization?: string;
  search?: string;
  role?: string[];
}
