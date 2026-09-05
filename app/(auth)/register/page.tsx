import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function Page() {
  return (
    <AuthCard
      heading="Create your account"
      description="Add the information below to get started with Heloci housing support."
    >
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
