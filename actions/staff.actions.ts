"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { createStaffMemberRecord } from "@/lib/staff/staff-management.service";

// Service-role admin client — only used server-side
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type CreateStaffResult =
  | { success: true; email: string }
  | { success: false; error: string };

export async function createStaffMember(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<CreateStaffResult> {
  const caller = await getCurrentUser();
  if (!caller?.organizationId) {
    return { success: false, error: "Organization not found." };
  }

  try {
    await requireOrgRole(caller.id, caller.organizationId, ["org_admin"]);
  } catch {
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

  // 2. Explicitly confirm the email with email_verified metadata
  try {
    await adminClient.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
      user_metadata: {
        email_verified: true
      }
    });
  } catch (err) {
    console.warn(`Warning: Failed to confirm email for ${email}:`, err);
    // Don't fail the entire operation, just log the warning
  }

  // 3. Insert into Prisma with STAFF role and link to the current organization
  try {
    await createStaffMemberRecord({
      name,
      email,
      organizationId: caller.organizationId,
      createdById: caller.id
    });
  } catch (err) {
    // Roll back the Supabase user if Prisma fails
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: "Database error. Please try again." };
  }

  revalidatePath("/admin/staff");
  return { success: true, email };
}
