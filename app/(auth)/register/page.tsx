import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { SecurityIndicators } from "@/components/auth/security-indicators";

export default function Page() {
  return (
    <AuthCard heading="Create your Heloci account" description="Start with the essentials and we’ll help you onboard step by step.">
      <RegisterForm />
      <SecurityIndicators />
    </AuthCard>
  );
}
