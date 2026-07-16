"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * Displays the signed-in user's name (from full_name metadata) with a
 * letter avatar. Falls back to the email prefix if no name is set.
 */
export function UserBadge() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const fullName: string =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "";
      setName(fullName);
      setEmail(user.email ?? "");
    });
  }, []);

  // What to show as the display label
  const displayName = name || email.split("@")[0] || "—";
  // First letter for the avatar circle
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand"
      >
        {initial}
      </div>
      <div className="hidden sm:block leading-tight">
        <p className="text-sm font-semibold text-slate-950 truncate max-w-[140px]">
          {displayName}
        </p>
        {name && (
          <p className="text-xs text-slate-400 truncate max-w-[140px]">{email}</p>
        )}
      </div>
    </div>
  );
}
