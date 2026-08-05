import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Allow SUPER_ADMIN, ADMIN, and STAFF
  if (user.role !== "ADMIN" && user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    if (user.role === "APPLICANT") {
      redirect("/applicant/dashboard");
    }
    redirect("/login");
  }

  return <>{children}</>;
}
