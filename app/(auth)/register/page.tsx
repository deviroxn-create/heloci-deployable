import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

export default function Page() {
  return (
    <AuthCard
      heading="Create your account"
      description="Add the information below to get started with Heloci housing support."
    >
      <div className="space-y-5">
        <SocialAuthButtons />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </AuthCard>
  );
}
