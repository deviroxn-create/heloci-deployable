import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Heloci Auth",
  description: "Sign in or create a Heloci account to access housing support."
};

export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
