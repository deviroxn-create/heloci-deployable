"use client";

import { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export function PageShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
        {title ? (
          <header className="mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h1>
          </header>
        ) : null}
        <section className="space-y-10">{children}</section>
      </main>
      <SiteFooter />
    </div>
  );
}
