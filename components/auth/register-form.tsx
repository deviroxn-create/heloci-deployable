"use client";

import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations/schemas";
import { supabase } from "@/lib/supabase/client";
import { registerUser } from "@/actions/auth.actions";
import type { z } from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (values: RegisterValues) => {
    if (busy) {
      return;
    }

    setError(null);
    setBusy(true);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[RegisterForm] submitting registration", { email: values.email });
    }

    // 1. Create the Supabase auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (authError) {
      setBusy(false);
      setError(authError.message);
      return;
    }

    // 2. Create the Prisma user record (server action)
    const result = await registerUser({
      email: values.email,
      name: values.fullName
    });

    if (!result.success) {
      setBusy(false);
      setError(result.error ?? "Failed to create account. Please try again.");
      return;
    }

    // 3. If email confirmation is disabled, session is live — go straight to dashboard
    if (data.session) {
      window.location.href = "/applicant/dashboard";
      return;
    }

    // 4. Email confirmation required
    setBusy(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="space-y-4 rounded-[16px] border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-green-800">Check your email</p>
        <p className="text-sm text-green-700">
          We&apos;ve sent a confirmation link to your inbox. Click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand transition hover:text-brandHover">
          Go to Sign In →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        <AuthInput
          label="Full name"
          type="text"
          autoComplete="name"
          icon={User}
          {...register("fullName")}
          error={errors.fullName?.message}
        />
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          {...register("email")}
          error={errors.email?.message}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          {...register("password")}
          error={errors.password?.message}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          icon={Lock}
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
      </div>

      {error ? (
        <p className="rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="h-14 w-full rounded-[16px] text-base font-semibold">
        {busy ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand transition hover:text-brandHover">
          Sign in
        </Link>
      </p>
    </form>
  );
}
