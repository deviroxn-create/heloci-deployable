"use client";

import { ReactNode, useState } from "react";
import { MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AssistantPanel } from "@/components/ai/assistant-panel";

export function PageShell({ title, children }: { title?: string; children: ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false);

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

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {assistantOpen ? (
          <div className="w-full max-w-[360px] rounded-[32px] border border-border bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">AI Chat</p>
                <p className="text-xs text-slate-500">Ask Heloci for eligibility help or housing support.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-slate-700 transition hover:bg-slate-100"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close chat panel"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <AssistantPanel />
            </div>
          </div>
        ) : null}
        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 transition hover:bg-blue-600"
          onClick={() => setAssistantOpen((current) => !current)}
          aria-label="Open AI chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
