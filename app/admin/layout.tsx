import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    if (user.role === "APPLICANT") {
      redirect("/applicant/dashboard");
    }
    redirect("/staff/dashboard");
  }

  return <>{children}</>;
}
