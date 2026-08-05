"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { inviteStaff, removeMember, updateMemberRole } from "@/lib/organizations/team-service";
import { saveNotificationSettings } from "@/lib/notifications/notification.service";
import {
  getOrganizationAdminData,
  updateOrganizationProfile,
  saveOrganizationPreferences,
  createOrganizationAuditLog,
  revalidateOrganizationAdminViews
} from "@/lib/organizations/organization-admin.service";

export async function getOrganizationAdminDataAction() {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return {
      organization: null,
      members: [],
      invitations: [],
      auditLogs: [],
      settings: {}
    };
  }

  return getOrganizationAdminData(user.organizationId, user.id);
}

export async function updateOrganizationProfileAction(input: {
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  emailFromName?: string;
  telegramChannelId?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  await requireOrgRole(user.id, user.organizationId, ["org_admin"]);

  const updated = await updateOrganizationProfile(user.organizationId, input);

  await createOrganizationAuditLog(user.id, "Organization", "updated_profile", { organizationId: user.organizationId });

  revalidateOrganizationAdminViews();
  return updated;
}

export async function saveOrganizationPreferencesAction(preferences: Record<string, unknown>) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  await requireOrgRole(user.id, user.organizationId, ["org_admin"]);

  const updated = await saveOrganizationPreferences(user.organizationId, preferences);

  await createOrganizationAuditLog(user.id, "Organization", "updated_preferences", { organizationId: user.organizationId });

  revalidateOrganizationAdminViews();
  return updated;
}

export async function inviteOrganizationMemberAction(email: string, role: string) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  return inviteStaff(user.organizationId, user.id, email, role);
}

export async function updateOrganizationMemberRoleAction(memberUserId: string, newRole: string) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  return updateMemberRole(user.organizationId, user.id, memberUserId, newRole);
}

export async function removeOrganizationMemberAction(memberUserId: string) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  return removeMember(user.organizationId, user.id, memberUserId);
}

export async function saveOrganizationCommunicationSettingsAction(settings: Record<string, unknown>) {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("organization_not_found");
  await requireOrgRole(user.id, user.organizationId, ["org_admin"]);
  await saveNotificationSettings(settings as any);
  revalidatePath("/admin/settings");
  return settings;
}
