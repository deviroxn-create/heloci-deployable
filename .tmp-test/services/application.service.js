"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listApplications = listApplications;
exports.getApplication = getApplication;
exports.createApplication = createApplication;
const client_1 = require("@prisma/client");
const client_2 = require("@/lib/prisma/client");
async function listApplications(userId) {
    return client_2.prisma.application.findMany({ where: { applicantId: userId }, include: { property: true } });
}
async function getApplication(id) {
    return client_2.prisma.application.findUnique({ where: { id }, include: { property: true, documents: true } });
}
async function createApplication(applicantId, programSlug, programName) {
    return client_2.prisma.application.create({
        data: {
            applicantId,
            status: client_1.ApplicationStatus.PENDING,
            notes: `Application created for program: ${programName} (${programSlug})`,
        },
    });
}
