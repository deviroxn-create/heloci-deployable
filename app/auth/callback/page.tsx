/**
 * Auth Callback Page
 * 
 * Handles post-authentication redirect based on user role:
 * - Platform Super Admin (role=SUPER_ADMIN, organizationId=null) → /admin/dashboard
 * - Organization Admin/Staff (role=ADMIN/STAFF, organizationId exists) → /admin/dashboard
 * - Applicant (role=APPLICANT) → /applicant/dashboard
 * 
 * This ensures all users land on the correct dashboard regardless of auth method.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthCallbackPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Not authenticated, go back to login
    redirect("/login");
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
