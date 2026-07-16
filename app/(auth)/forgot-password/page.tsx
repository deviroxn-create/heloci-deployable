import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function Page() {
  return (
    <AuthCard heading="Reset your password" description="Enter the email tied to your Heloci account and we’ll send reset instructions.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
