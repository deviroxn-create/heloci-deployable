import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

export default function Page() {
  return (
    <AuthCard
      heading="Sign in to your account"
      description="Access your housing support dashboard, saved application, and case updates."
    >
      <div className="space-y-5">
        <SocialAuthButtons />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <LoginForm />
      </div>
    </AuthCard>
  );
}
