import { prisma } from "@/lib/prisma/client";
import { requireOrgRole } from "@/lib/auth/rbac";
import { notificationService } from "@/lib/notifications/notification.service";
import { randomBytes } from "crypto";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";

export async function inviteStaff(orgId: string, inviterId: string, email: string, role: string) {
  await requireOrgRole(inviterId, orgId, ["org_admin"]);

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({ data: { organizationId: orgId, email, role, token, invitedBy: inviterId, expiresAt } });

  await prisma.auditLog.create({ data: { userId: inviterId, entity: "Invitation", action: "invited_staff", meta: { invitationId: invitation.id, email } } });

  await notificationService.notify("staff_invited", { email, invitationId: invitation.id, token, organizationId: orgId });

  return invitation;
}

export async function acceptInvitation(token: string, userId: string) {
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite) throw new Error("invalid_token");
  if (invite.expiresAt < new Date()) throw new Error("expired_token");
  if (invite.acceptedAt) throw new Error("already_accepted");

  // can't accept if user already member
  const existing = await prisma.organizationMember.findFirst({ where: { organizationId: invite.organizationId, userId } });
  if (existing) throw new Error("already_member");

  const member = await prisma.organizationMember.create({ data: { organizationId: invite.organizationId, userId, role: invite.role } });

  await prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

  await prisma.auditLog.create({ data: { userId, entity: "Invitation", action: "accepted", meta: { invitationId: invite.id } } });

  await notificationService.notify("staff_invitation_accepted", { userId, organizationId: invite.organizationId });

  return member;
}

export async function updateMemberRole(orgId: string, adminId: string, memberUserId: string, newRole: string) {
  await requireOrgRole(adminId, orgId, ["org_admin"]);

  if (adminId === memberUserId) throw new Error("cannot_change_own_role");

  const member = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: memberUserId } });
  if (!member) throw new Error("member_not_found");

  const updated = await prisma.organizationMember.update({ where: { id: member.id }, data: { role: newRole } });

  await prisma.auditLog.create({ data: { userId: adminId, entity: "OrganizationMember", action: "role_updated", meta: { memberId: member.id, newRole } } });

  await notificationService.notify("staff_role_changed", { userId: memberUserId, organizationId: orgId, newRole });

  try {
    await queueTelegramAlert({ type: 'user_role_changed', level: 'WARN', organizationId: orgId, data: { name: updated.userId ?? memberUserId, from: member.role, to: newRole, actorName: adminId } });
  } catch (e) {
    console.error('team-service: queueTelegramAlert failed', e);
  }

  return updated;
}

export async function removeMember(orgId: string, adminId: string, memberUserId: string) {
  await requireOrgRole(adminId, orgId, ["org_admin"]);

  if (adminId === memberUserId) throw new Error("cannot_remove_self");

  const member = await prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: memberUserId } });
  if (!member) throw new Error("member_not_found");

  // ensure not last org_admin
  if (member.role === "org_admin") {
    const admins = await prisma.organizationMember.count({ where: { organizationId: orgId, role: "org_admin" } });
    if (admins <= 1) throw new Error("cannot_remove_last_org_admin");
  }

  await prisma.organizationMember.delete({ where: { id: member.id } });

  await prisma.auditLog.create({ data: { userId: adminId, entity: "OrganizationMember", action: "removed", meta: { memberId: member.id } } });

  await notificationService.notify("staff_removed", { userId: memberUserId, organizationId: orgId });

  return true;
}
