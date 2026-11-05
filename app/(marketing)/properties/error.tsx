"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/shared/page-shell";

export default function PropertyDiscoveryError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Property discovery failed to load", error);
  }, [error]);

  return (
    <PageShell>
      <section role="alert" className="rounded-[28px] border border-border bg-white px-6 py-12 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-950">We couldn’t load property listings.</h1>
        <p className="mt-3 text-sm text-slate-600">Please try again. Your search and eligibility details have not been changed.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brandHover">
          Try again
        </button>
      </section>
    </PageShell>
  );
}
