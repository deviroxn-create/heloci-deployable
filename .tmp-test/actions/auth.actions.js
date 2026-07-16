"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
/**
 * Creates the Prisma User record after Supabase sign-up.
 * Called from the register form right after supabase.auth.signUp() succeeds.
 */
async function registerUser(data) {
    try {
        const user = await client_1.prisma.user.upsert({
            where: { email: data.email },
            update: { name: data.name },
            create: {
                email: data.email,
                name: data.name,
                role: "APPLICANT"
            }
        });
        await notification_service_1.notificationService.notify("user_registration", {
            userId: user.id,
            userEmail: user.email,
            recipientEmail: user.email,
            name: user.name || data.name
        });
        return { success: true };
    }
    catch (err) {
        console.error("[registerUser]", err);
        return { success: false, error: "Database error. Please try again." };
    }
}
