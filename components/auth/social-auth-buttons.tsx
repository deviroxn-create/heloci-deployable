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

  const handleProvider = async (provider: "google" | "apple") => {
    if (typeof window === "undefined") {
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Redirect to auth callback that will determine correct dashboard
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setBusy(false);

    if (error) {
      onError?.(error.message);
    }
  };

  return (
    <div className="space-y-3">
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
