import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function Page() {
  return (
    <AuthCard
      heading="Sign in to your account"
      description="Access your housing support dashboard, saved application, and case updates."
    >
      <LoginForm />
    </AuthCard>
  );
}
