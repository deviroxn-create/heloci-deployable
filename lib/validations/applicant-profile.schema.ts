import { z } from "zod";

export const applicantProfileSchema = z.object({
  personal: z
    .object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      preferredName: z.string().optional(),
      isDisabilityAffected: z.boolean().optional(),
      isVeteran: z.boolean().optional(),
      isPublicWorker: z.boolean().optional()
    })
    .optional(),
  household: z
    .object({
      householdSize: z.number().int().min(1).optional(),
      members: z
        .array(
          z.object({
            fullName: z.string().optional(),
            relationship: z.string().optional(),
            dateOfBirth: z.string().optional(),
            isDependent: z.boolean().optional()
          })
        )
        .optional()
    })
    .optional(),
  income: z
    .object({
      monthlyIncome: z.number().nonnegative().optional(),
      employmentStatus: z.string().optional(),
      employer: z.string().optional(),
      workHours: z.number().nonnegative().optional(),
      sourceOfIncome: z.array(z.string()).optional()
    })
    .optional(),
  education: z
    .object({
      highestEducationLevel: z.string().optional(),
      schoolName: z.string().optional(),
      graduationYear: z.number().int().optional()
    })
    .optional(),
  housing: z
    .object({
      currentHousingSituation: z.string().optional(),
      housingHistory: z
        .array(
          z.object({
            location: z.string().optional(),
            status: z.string().optional(),
            yearsAtAddress: z.number().nonnegative().optional()
          })
        )
        .optional()
    })
    .optional(),
  preferences: z
    .object({
      preferredLocations: z.array(z.string()).optional(),
      housingGoal: z.string().optional()
    })
    .optional(),
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        status: z.string().optional()
      })
    )
    .optional(),
  meta: z
    .object({
      completedSections: z.array(z.string()).optional(),
      lastUpdatedAt: z.string().optional(),
      version: z.number().int().optional()
    })
    .optional()
});
