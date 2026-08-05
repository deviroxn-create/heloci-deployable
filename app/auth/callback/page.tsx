/**
 * Auth Callback Page
 * 
 * Handles email verification token exchange and post-authentication redirect:
 * 
 * PHASE 1: Token Exchange
 * - Accepts 'code' parameter from Supabase email link
 * - Calls exchangeCodeForSession(code) to confirm email in Supabase
 * - Marks user as email_confirmed in auth.users table
 * - Establishes authenticated session
 * 
 * PHASE 2: Role-Based Routing
 * - Platform Super Admin (role=SUPER_ADMIN, organizationId=null) → /admin/dashboard
 * - Organization Admin/Staff (role=ADMIN/STAFF, organizationId exists) → /admin/dashboard
 * - Applicant (role=APPLICANT) → /applicant/dashboard
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const code = params?.code as string | undefined;

  // PHASE 1: Token Exchange
  // If code is present from email verification link, exchange it for a session
  if (code) {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // Token exchange failed — redirect to login with error
      redirect(`/login?error=verification_failed&message=${encodeURIComponent(error.message)}`);
    }
    
    // Token exchange succeeded — email is now confirmed in Supabase
    // Session is established and cookies are set by Supabase client
  }

  // PHASE 2: Get current user and route based on role
  const user = await getCurrentUser();

  if (!user) {
    // Not authenticated, go back to login
    redirect("/login?error=no_session");
  }

  // Platform Super Admin with null organizationId
  if (user.role === "SUPER_ADMIN" && !user.organizationId) {
    redirect("/admin/dashboard");
  }

  // Organization Admin or Staff
  if ((user.role === "ADMIN" || user.role === "STAFF") && user.organizationId) {
    redirect("/admin/dashboard");
  }

  // Applicant
  if (user.role === "APPLICANT") {
    redirect("/applicant/dashboard");
  }

  // Default fallback (should not reach here if roles are correct)
  redirect("/login?error=invalid_role");
}
