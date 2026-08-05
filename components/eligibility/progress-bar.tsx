"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percent = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          Question{" "}
          <span className="font-semibold text-slate-900">{current + 1}</span>
          {" "}of{" "}
          <span className="font-semibold text-slate-900">{total}</span>
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              percent < 33
                ? "bg-slate-100 text-slate-600"
                : percent < 66
                ? "bg-blue-50 text-[#006AFF]"
                : "bg-emerald-50 text-emerald-700"
            )}
          >
            {percent}% complete
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% complete`}
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#006AFF] to-[#338bff] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Step dots — visible on md+ */}
      <div className="hidden items-center justify-between md:flex">
        {Array.from({ length: Math.min(total, 10) }).map((_, index) => {
          const stepPercent = Math.round(((index + 1) / Math.min(total, 10)) * total);
          const isDone = current >= stepPercent - 1;
          const isCurrent = current === stepPercent - 1;
          return (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                index === 0 ? "" : "ml-0.5",
                isDone
                  ? "bg-[#006AFF]"
                  : isCurrent
                  ? "bg-[#006AFF]/40"
                  : "bg-slate-200"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
