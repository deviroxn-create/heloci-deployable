"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrgRole = requireOrgRole;
exports.getUserOrganizations = getUserOrganizations;
const client_1 = require("@/lib/prisma/client");
async function requireOrgRole(userId, organizationId, roles) {
    const member = await client_1.prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId } }
    });
    if (!member || !roles.includes(member.role)) {
        throw new Error("Unauthorized");
    }
    return member;
}
async function getUserOrganizations(userId) {
    return client_1.prisma.organizationMember.findMany({
        where: { userId },
        include: { organization: true }
    });
}
