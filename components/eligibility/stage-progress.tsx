"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface StageProgressProps {
  stageIndex: number;
  totalStages: number;
  stageLabel: string;
  stepIndex: number;
  totalSteps: number;
  className?: string;
}

export function StageProgress({
  stageIndex,
  totalStages,
  stageLabel,
  stepIndex,
  totalSteps,
  className,
}: StageProgressProps) {
  const stagePercent =
    totalStages > 0 ? Math.round(((stageIndex + 1) / totalStages) * 100) : 0;
  const stepPercent =
    totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {stageLabel && (
            <span className="truncate text-sm font-semibold text-slate-700">
              {stageLabel}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              stepPercent < 33
                ? "bg-slate-100 text-slate-600"
                : stepPercent < 66
                ? "bg-blue-50 text-[#006AFF]"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            {stepPercent}% complete
          </span>
        </div>
      </div>

      {/* Overall progress track */}
      <div
        role="progressbar"
        aria-valuenow={stepPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${stepPercent}% of interview complete`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#006AFF] to-[#338bff] transition-all duration-500 ease-out"
          style={{ width: `${stepPercent}%` }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalStages }).map((_, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          return (
            <div
              key={i}
              title={`Stage ${i + 1}`}
              className={cn(
                "flex h-4 items-center justify-center rounded-full transition-all duration-300",
                current
                  ? "flex-1 bg-[#006AFF] px-1"
                  : done
                  ? "h-4 w-4 shrink-0 bg-[#006AFF]"
                  : "h-4 w-4 shrink-0 bg-slate-200"
              )}
            >
              {done && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
              {current && (
                <span className="text-[9px] font-bold text-white">{stageLabel.slice(0, 14)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
