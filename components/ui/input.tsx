import * as React from "react";
import clsx from "clsx";

export type InputProps = React.ComponentPropsWithRef<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-3xl border border-border bg-white px-4 py-3 transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
