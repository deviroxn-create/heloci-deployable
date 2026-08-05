"use client";

import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CaseworkerMessage } from "./conversation-config";

interface CaseworkerChatProps {
  stepId: string;
  message: CaseworkerMessage;
  stageLabel?: string;
  /** When stepId changes we animate the new message in */
  animateKey?: string | number;
}

const AVATAR_COLORS: Record<NonNullable<CaseworkerMessage["tone"]>, string> = {
  standard:    "bg-[#006AFF]",
  encouraging: "bg-emerald-500",
  important:   "bg-amber-500",
};

const BORDER_COLORS: Record<NonNullable<CaseworkerMessage["tone"]>, string> = {
  standard:    "border-[#006AFF]/20",
  encouraging: "border-emerald-200",
  important:   "border-amber-200",
};

const BG_COLORS: Record<NonNullable<CaseworkerMessage["tone"]>, string> = {
  standard:    "from-[#f0f7ff] to-white",
  encouraging: "from-emerald-50 to-white",
  important:   "from-amber-50 to-white",
};

export function CaseworkerChat({
  message,
  stageLabel,
  animateKey,
}: CaseworkerChatProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevKey = useRef<string | number | undefined>(undefined);

  const tone = message.tone ?? "standard";

  // Animate in whenever the step changes
  useEffect(() => {
    if (prevKey.current !== animateKey) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 80);
      prevKey.current = animateKey;
      return () => clearTimeout(t);
    }
  }, [animateKey]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm transition-all duration-300",
        BORDER_COLORS[tone],
        BG_COLORS[tone],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
              AVATAR_COLORS[tone]
            )}
            aria-hidden="true"
          >
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Heloci Case Worker</p>
            {stageLabel && (
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {stageLabel}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/70 hover:text-slate-600"
          aria-label={collapsed ? "Show guidance" : "Hide guidance"}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Bubbles */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "max-h-0 overflow-hidden opacity-0" : "max-h-72 opacity-100"
        )}
      >
        <div className="space-y-2.5 px-4 pb-4">
          {/* Primary message */}
          <div className="flex gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
                AVATAR_COLORS[tone]
              )}
              aria-hidden="true"
            >
              H
            </div>
            <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
              {message.message}
            </div>
          </div>

          {/* Follow-up message */}
          {message.followUp && (
            <div className="flex gap-3 pl-2">
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
                  AVATAR_COLORS[tone]
                )}
                aria-hidden="true"
              >
                H
              </div>
              <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-600 shadow-sm">
                {message.followUp}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
