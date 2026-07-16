import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "APPLICANT") {
    if (user.role === "STAFF") {
      redirect("/staff/dashboard");
    }
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}
