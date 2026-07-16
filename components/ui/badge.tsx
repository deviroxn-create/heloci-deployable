import { ReactNode } from "react";
import clsx from "clsx";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700", className)}>
      {children}
    </span>
  );
}
