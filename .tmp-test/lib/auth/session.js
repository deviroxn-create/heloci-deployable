"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
const server_1 = require("@/lib/supabase/server");
const client_1 = require("@/lib/prisma/client");
function inferRole(email, metadataRole) {
    const normalizedEmail = email.toLowerCase();
    if (metadataRole)
        return metadataRole;
    if (normalizedEmail.includes("admin"))
        return "ADMIN";
    if (normalizedEmail.includes("staff"))
        return "STAFF";
    return "APPLICANT";
}
async function getCurrentUser() {
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
        return null;
    }
    const inferredRole = inferRole(user.email, user.user_metadata?.role);
    // Auto-create the Prisma row if it's missing, and sync the role so seeded
    // admin/staff accounts don't get downgraded to applicant on first sign-in.
    const dbUser = await client_1.prisma.user.upsert({
        where: { email: user.email },
        update: {
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
            role: inferredRole
        },
        create: {
            email: user.email,
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            role: inferredRole
        }
    });
    return {
        id: dbUser.id,
        name: dbUser.name ?? user.email,
        email: dbUser.email,
        role: dbUser.role,
        organizationId: dbUser.organizationId
    };
}
