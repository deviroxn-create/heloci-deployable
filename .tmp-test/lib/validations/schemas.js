"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSchema = exports.propertySchema = exports.passwordResetSchema = exports.registerSchema = exports.authSchema = void 0;
const zod_1 = require("zod");
exports.authSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Enter a valid email address." }),
    password: zod_1.z.string().min(8, { message: "Password must be at least 8 characters." })
});
exports.registerSchema = exports.authSchema
    .extend({
    fullName: zod_1.z.string().min(2, { message: "Please enter your full name." }),
    confirmPassword: zod_1.z.string().min(8, { message: "Confirm your password." })
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
exports.passwordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.propertySchema = zod_1.z.object({
    title: zod_1.z.string().min(5),
    address: zod_1.z.string().min(5),
    city: zod_1.z.string().min(2),
    state: zod_1.z.string().min(2),
    zip: zod_1.z.string().min(5),
    rent: zod_1.z.number().int().nonnegative(),
    bedrooms: zod_1.z.number().int().nonnegative(),
    bathrooms: zod_1.z.number().int().nonnegative(),
    sqft: zod_1.z.number().int().nonnegative()
});
exports.applicationSchema = zod_1.z.object({
    propertyId: zod_1.z.string().optional(),
    income: zod_1.z.number().int().nonnegative(),
    householdSize: zod_1.z.number().int().min(1),
    notes: zod_1.z.string().max(1000).optional()
});
