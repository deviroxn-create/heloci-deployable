"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { passwordResetSchema } from "@/lib/validations/schemas";
import { supabase } from "@/lib/supabase/client";
import type { z } from "zod";

type ResetPasswordValues = z.infer<typeof passwordResetSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(passwordResetSchema)
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setError(null);
    setSuccess(null);
    setBusy(true);

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Check your inbox for password reset instructions.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AuthInput
        label="Email"
        type="email"
        autoComplete="email"
        icon={Mail}
        {...register("email")}
        error={errors.email?.message}
      />

      {error ? <p className="rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}
      {success ? <p className="rounded-[16px] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{success}</p> : null}

      <Button type="submit" disabled={busy} className="h-14 w-full rounded-[16px] text-base font-semibold">
        {busy ? "Sending reset link..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Remembered your password?{' '}
        <Link href="/login" className="font-semibold text-brand transition hover:text-brandHover">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
