import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STAFF") {
    if (user.role === "APPLICANT") {
      redirect("/applicant/dashboard");
    }
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}
