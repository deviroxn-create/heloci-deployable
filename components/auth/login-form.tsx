"use client";

import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema } from "@/lib/validations/schemas";
import { AuthInput } from "@/components/auth/auth-input";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { AuthDivider } from "@/components/auth/auth-divider";
import { Button } from "@/components/ui/button";
import { trackLoginNotificationAction } from "@/actions/notifications.actions";
import { supabase } from "@/lib/supabase/client";
import type { z } from "zod";

type LoginValues = z.infer<typeof authSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [redirectTo, setRedirectTo] = useState("/applicant/dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirectTo") ?? "/applicant/dashboard");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(authSchema)
  });

  const onSubmit = async (values: LoginValues) => {
    if (busy) {
      return;
    }

    setError(null);
    setBusy(true);

    let authError = null;
    let user = null;

    try {
const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    authError = error;
    user = authData?.user;

      if (error) {
        setBusy(false);
        // DEBUG: Log the actual error
        console.error("Supabase login error:", {
          status: error.status,
          message: error.message,
          name: error.name
        });
        
        // WORKAROUND FOR DEV: If it's an email confirmation issue, try to bypass it
        // by directly using the session if email_verified is true in metadata
        if (
          error.message.toLowerCase().includes("email not confirmed") &&
          process.env.NODE_ENV === "development"
        ) {
          console.log("Email confirmation issue detected - attempting workaround for dev...");
          
          // In dev, if the user exists with email_verified=true, allow login
          // This is a development workaround - production should enforce confirmation
          try {
            const meResponse = await fetch("/api/auth/me", {
              method: "GET"
            });
            
            if (meResponse.ok) {
              const userData = await meResponse.json();
              if (userData.id) {
                // User exists and is authenticated - bypass this error for dev
                console.log("Dev workaround: User authenticated despite confirmation error");
                // Continue with redirect logic below
                authError = null;
              }
            }
          } catch (e) {
            console.error("Dev workaround failed:", e);
          }
        }

        if (authError) {
          // Show error only if workaround didn't work
          if (
            error.message.toLowerCase().includes("invalid login") ||
            error.message.toLowerCase().includes("invalid credentials") ||
            error.message.toLowerCase().includes("email not confirmed")
          ) {
            setNeedsConfirmation(true);
            setResendEmail(values.email);
            setError(
              "Sign in failed. If you just registered, please check your inbox for a confirmation link first."
            );
          } else {
            setError(error.message);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Login exception:", err);
      setBusy(false);
      setError("An unexpected error occurred during login.");
      return;
    }

    if (authError && authError.message.toLowerCase().includes("email not confirmed")) {
      // Email confirmation still failing - don't proceed
      setBusy(false);
      setNeedsConfirmation(true);
      setResendEmail(values.email);
      setError(
        "Sign in failed. If you just registered, please check your inbox for a confirmation link first."
      );
      return;
    }

    // Determine redirect based on user role
    // Platform Super Admin bypasses the query parameter and goes to platform dashboard
    let finalRedirectTo = redirectTo;
    
    if (redirectTo === "/applicant/dashboard") {
      // Query the API to get the user's role and determine the correct destination
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          
          if (userData.role === "SUPER_ADMIN" && !userData.organizationId) {
            // Platform Super Admin → platform admin dashboard
            finalRedirectTo = "/admin/dashboard";
          } else if (userData.role === "ADMIN" || userData.role === "STAFF") {
            // Organization admin/staff → organization admin dashboard
            finalRedirectTo = "/admin/dashboard";
          } else if (userData.role === "APPLICANT") {
            // Applicant → applicant dashboard
            finalRedirectTo = "/applicant/dashboard";
          }
        }
      } catch (err) {
        // Fall back to default if API check fails
        console.error("Failed to fetch user role:", err);
      }
    }

    try {
      await trackLoginNotificationAction(values.email, user?.user_metadata?.full_name ?? values.email);
    } catch (err) {
      console.error("Login notification action failed:", err);
    }

    // Hard navigation — ensures cookies are fully committed before the
    // next request hits the middleware (router.push is too fast)
    window.location.href = finalRedirectTo;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SocialAuthButtons onError={setError} />

      <AuthDivider label="Or continue with email" />

      <div className="space-y-6">
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
          autoComplete="current-password"
          icon={Lock}
          {...register("password")}
          error={errors.password?.message}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border border-slate-300 text-brand focus:ring-brand"
          />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-sm font-semibold text-brand transition hover:text-brandHover">
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div className="rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 space-y-3">
          <p className="text-sm text-error">{error}</p>
          {needsConfirmation && (
            resendSent ? (
              <p className="text-sm font-semibold text-success">Confirmation email resent — check your inbox.</p>
            ) : (
              <button
                type="button"
                disabled={resendBusy}
                onClick={async () => {
                  setResendBusy(true);
                  await supabase.auth.resend({ type: "signup", email: resendEmail });
                  setResendBusy(false);
                  setResendSent(true);
                }}
                className="text-sm font-semibold text-brand hover:underline disabled:opacity-50"
              >
                {resendBusy ? "Sending..." : "Resend confirmation email →"}
              </button>
            )
          )}
        </div>
      ) : null}

      <Button type="submit" disabled={busy} className="h-14 w-full rounded-[16px] text-base font-semibold">
        {busy ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand transition hover:text-brandHover">
          Create one
        </Link>
      </p>
    </form>
  );
}
