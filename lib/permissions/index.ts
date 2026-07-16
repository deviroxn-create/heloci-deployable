import { Role } from "@prisma/client";

export const isApplicant = (role: Role) => role === Role.APPLICANT;
export const isStaff = (role: Role) => role === Role.STAFF;
export const isAdmin = (role: Role) => role === Role.ADMIN;
