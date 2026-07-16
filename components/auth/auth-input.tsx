"use client";

import * as React from "react";
import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import clsx from "clsx";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
  icon?: LucideIcon;
};

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, helperText, error, icon: Icon, type = "text", className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (visible ? "text" : "password") : type;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-900">
          <label htmlFor={props.id || props.name}>{label}</label>
          {helperText ? <span className="text-slate-500">{helperText}</span> : null}
        </div>
        <div className={clsx("relative", error ? "ring-1 ring-error/40" : "")}> 
          {Icon ? (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <Input
            ref={ref}
            type={inputType}
            className={clsx(
              "h-14 rounded-[16px] border border-border bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15",
              Icon ? "pl-12" : "px-4",
              isPassword ? "pr-20" : "pr-4",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-9 items-center justify-center rounded-full bg-surface px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
