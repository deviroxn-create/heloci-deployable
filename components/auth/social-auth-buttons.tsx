"use client";

import { useState } from "react";
import { Apple, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type SocialAuthButtonsProps = {
  onError?: (message: string) => void;
};

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProvider = async (provider: "google" | "apple") => {
    if (typeof window === "undefined") {
      return;
    }

    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setBusy(false);

    if (error) {
      setError(error.message);
      onError?.(error.message);
    }
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-14 w-full justify-center gap-2 text-slate-700"
        onClick={() => handleProvider("google")}
        disabled={busy}
      >
        <Globe className="h-5 w-5" />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-14 w-full justify-center gap-2 text-slate-700"
        onClick={() => handleProvider("apple")}
        disabled={busy}
      >
        <Apple className="h-5 w-5" />
        Continue with Apple
      </Button>
    </div>
  );
}
