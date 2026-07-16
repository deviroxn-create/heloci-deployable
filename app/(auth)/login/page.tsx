import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SecurityIndicators } from "@/components/auth/security-indicators";

export default function Page() {
  return (
    <AuthCard heading="Welcome back" description="Continue your housing journey with Heloci.">
      <LoginForm />
      <SecurityIndicators />
    </AuthCard>
  );
}
