"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProperties = getProperties;
exports.getPropertyById = getPropertyById;
const client_1 = require("@/lib/prisma/client");
async function getProperties() {
    return client_1.prisma.property.findMany({ include: { images: true } });
}
async function getPropertyById(id) {
    return client_1.prisma.property.findUnique({ where: { id }, include: { images: true } });
}
