import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import clsx from "clsx";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md";
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-white shadow-soft hover:bg-brandHover focus-visible:ring-brand/30",
  secondary: "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300",
  outline: "border border-border bg-white text-slate-950 hover:bg-slate-50 focus-visible:ring-brand/20",
  ghost: "bg-transparent text-slate-950 hover:bg-slate-100 focus-visible:ring-brand/20"
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm"
};

export function Button({ children, className = "", variant = "primary", size = "md", asChild = false, ...props }: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<Record<string, any>>, {
      className: clsx((children as ReactElement<Record<string, any>>).props.className, classes),
      ...props
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
