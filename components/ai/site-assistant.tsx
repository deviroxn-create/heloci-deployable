"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { AssistantPanel } from "@/components/ai/assistant-panel";

export function SiteAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-full max-w-[360px] rounded-[32px] border border-border bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">AI Assistant</p>
              <p className="text-xs text-slate-500">Ask Heloci for eligibility help or housing support.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-slate-700 transition hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label="Close AI assistant"
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
        onClick={() => setOpen((current) => !current)}
        aria-label="Open AI assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
