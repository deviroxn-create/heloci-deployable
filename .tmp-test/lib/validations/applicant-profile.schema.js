"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicantProfileSchema = void 0;
const zod_1 = require("zod");
exports.applicantProfileSchema = zod_1.z.object({
    personal: zod_1.z
        .object({
        fullName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        preferredName: zod_1.z.string().optional(),
        isDisabilityAffected: zod_1.z.boolean().optional(),
        isVeteran: zod_1.z.boolean().optional(),
        isPublicWorker: zod_1.z.boolean().optional()
    })
        .optional(),
    household: zod_1.z
        .object({
        householdSize: zod_1.z.number().int().min(1).optional(),
        members: zod_1.z
            .array(zod_1.z.object({
            fullName: zod_1.z.string().optional(),
            relationship: zod_1.z.string().optional(),
            dateOfBirth: zod_1.z.string().optional(),
            isDependent: zod_1.z.boolean().optional()
        }))
            .optional()
    })
        .optional(),
    income: zod_1.z
        .object({
        monthlyIncome: zod_1.z.number().nonnegative().optional(),
        employmentStatus: zod_1.z.string().optional(),
        employer: zod_1.z.string().optional(),
        workHours: zod_1.z.number().nonnegative().optional(),
        sourceOfIncome: zod_1.z.array(zod_1.z.string()).optional()
    })
        .optional(),
    education: zod_1.z
        .object({
        highestEducationLevel: zod_1.z.string().optional(),
        schoolName: zod_1.z.string().optional(),
        graduationYear: zod_1.z.number().int().optional()
    })
        .optional(),
    housing: zod_1.z
        .object({
        currentHousingSituation: zod_1.z.string().optional(),
        housingHistory: zod_1.z
            .array(zod_1.z.object({
            location: zod_1.z.string().optional(),
            status: zod_1.z.string().optional(),
            yearsAtAddress: zod_1.z.number().nonnegative().optional()
        }))
            .optional()
    })
        .optional(),
    preferences: zod_1.z
        .object({
        preferredLocations: zod_1.z.array(zod_1.z.string()).optional(),
        housingGoal: zod_1.z.string().optional()
    })
        .optional(),
    documents: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
        fileName: zod_1.z.string().optional(),
        fileUrl: zod_1.z.string().optional(),
        status: zod_1.z.string().optional()
    }))
        .optional(),
    meta: zod_1.z
        .object({
        completedSections: zod_1.z.array(zod_1.z.string()).optional(),
        lastUpdatedAt: zod_1.z.string().optional(),
        version: zod_1.z.number().int().optional()
    })
        .optional()
});
