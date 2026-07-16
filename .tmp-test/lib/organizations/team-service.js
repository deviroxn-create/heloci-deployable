"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteStaff = inviteStaff;
exports.acceptInvitation = acceptInvitation;
exports.updateMemberRole = updateMemberRole;
exports.removeMember = removeMember;
const client_1 = require("@/lib/prisma/client");
const rbac_1 = require("@/lib/auth/rbac");
const notification_service_1 = require("@/lib/notifications/notification.service");
const crypto_1 = require("crypto");
async function inviteStaff(orgId, inviterId, email, role) {
    await (0, rbac_1.requireOrgRole)(inviterId, orgId, ["org_admin"]);
    const token = (0, crypto_1.randomBytes)(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await client_1.prisma.invitation.create({ data: { organizationId: orgId, email, role, token, invitedBy: inviterId, expiresAt } });
    await client_1.prisma.auditLog.create({ data: { userId: inviterId, entity: "Invitation", action: "invited_staff", meta: { invitationId: invitation.id, email } } });
    await notification_service_1.notificationService.notify("staff_invited", { email, invitationId: invitation.id, token, organizationId: orgId });
    return invitation;
}
async function acceptInvitation(token, userId) {
    const invite = await client_1.prisma.invitation.findUnique({ where: { token } });
    if (!invite)
        throw new Error("invalid_token");
    if (invite.expiresAt < new Date())
        throw new Error("expired_token");
    if (invite.acceptedAt)
        throw new Error("already_accepted");
    // can't accept if user already member
    const existing = await client_1.prisma.organizationMember.findFirst({ where: { organizationId: invite.organizationId, userId } });
    if (existing)
        throw new Error("already_member");
    const member = await client_1.prisma.organizationMember.create({ data: { organizationId: invite.organizationId, userId, role: invite.role } });
    await client_1.prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await client_1.prisma.auditLog.create({ data: { userId, entity: "Invitation", action: "accepted", meta: { invitationId: invite.id } } });
    await notification_service_1.notificationService.notify("staff_invitation_accepted", { userId, organizationId: invite.organizationId });
    return member;
}
async function updateMemberRole(orgId, adminId, memberUserId, newRole) {
    await (0, rbac_1.requireOrgRole)(adminId, orgId, ["org_admin"]);
    if (adminId === memberUserId)
        throw new Error("cannot_change_own_role");
    const member = await client_1.prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: memberUserId } });
    if (!member)
        throw new Error("member_not_found");
    const updated = await client_1.prisma.organizationMember.update({ where: { id: member.id }, data: { role: newRole } });
    await client_1.prisma.auditLog.create({ data: { userId: adminId, entity: "OrganizationMember", action: "role_updated", meta: { memberId: member.id, newRole } } });
    await notification_service_1.notificationService.notify("staff_role_changed", { userId: memberUserId, organizationId: orgId, newRole });
    return updated;
}
async function removeMember(orgId, adminId, memberUserId) {
    await (0, rbac_1.requireOrgRole)(adminId, orgId, ["org_admin"]);
    if (adminId === memberUserId)
        throw new Error("cannot_remove_self");
    const member = await client_1.prisma.organizationMember.findFirst({ where: { organizationId: orgId, userId: memberUserId } });
    if (!member)
        throw new Error("member_not_found");
    // ensure not last org_admin
    if (member.role === "org_admin") {
        const admins = await client_1.prisma.organizationMember.count({ where: { organizationId: orgId, role: "org_admin" } });
        if (admins <= 1)
            throw new Error("cannot_remove_last_org_admin");
    }
    await client_1.prisma.organizationMember.delete({ where: { id: member.id } });
    await client_1.prisma.auditLog.create({ data: { userId: adminId, entity: "OrganizationMember", action: "removed", meta: { memberId: member.id } } });
    await notification_service_1.notificationService.notify("staff_removed", { userId: memberUserId, organizationId: orgId });
    return true;
}
