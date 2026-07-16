"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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
  // Only admins can do this
  const caller = await getCurrentUser();
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
    await prisma.user.upsert({
      where: { email },
      update: { name, role: "STAFF" },
      create: { name, email, role: "STAFF" }
    });
  } catch (err) {
    // Roll back the Supabase user if Prisma fails
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: "Database error. Please try again." };
  }

  revalidatePath("/admin/staff");
  return { success: true, email };
}
