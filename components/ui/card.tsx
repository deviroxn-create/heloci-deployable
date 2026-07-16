import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-border bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 flex flex-wrap items-start justify-between gap-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-sm leading-7 text-slate-600 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
