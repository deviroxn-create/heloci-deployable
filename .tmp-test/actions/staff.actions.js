"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffMember = createStaffMember;
const supabase_js_1 = require("@supabase/supabase-js");
const client_1 = require("@/lib/prisma/client");
const session_1 = require("@/lib/auth/session");
const cache_1 = require("next/cache");
// Service-role admin client — only used server-side
function getAdminClient() {
    return (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function createStaffMember(formData) {
    // Only admins can do this
    const caller = await (0, session_1.getCurrentUser)();
    if (!caller || caller.role !== "ADMIN") {
        return { success: false, error: "Unauthorized." };
    }
    const { name, email, password } = formData;
    // 1. Create the Supabase auth user with email already confirmed
    const adminClient = getAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
    });
    if (authError) {
        return { success: false, error: authError.message };
    }
    // 2. Insert into Prisma with STAFF role
    try {
        await client_1.prisma.user.upsert({
            where: { email },
            update: { name, role: "STAFF" },
            create: { name, email, role: "STAFF" }
        });
    }
    catch (err) {
        // Roll back the Supabase user if Prisma fails
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: "Database error. Please try again." };
    }
    (0, cache_1.revalidatePath)("/admin/staff");
    return { success: true, email };
}
