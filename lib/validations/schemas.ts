import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." })
});

export const registerSchema = authSchema
  .extend({
    fullName: z.string().min(2, { message: "Please enter your full name." }),
    confirmPassword: z.string().min(8, { message: "Confirm your password." })
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"]
      });
    }
  });

export const passwordResetSchema = z.object({
  email: z.string().email()
});

export const propertySchema = z.object({
  title: z.string().min(5),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(5),
  rent: z.number().int().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  sqft: z.number().int().nonnegative()
});

export const applicationSchema = z.object({
  propertyId: z.string().optional(),
  income: z.number().int().nonnegative(),
  householdSize: z.number().int().min(1),
  notes: z.string().max(1000).optional()
});
