import { ReactNode } from "react";

type AuthCardProps = {
  heading: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ heading, description, children }: AuthCardProps) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white p-10 shadow-card">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">Secure & welcoming</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{heading}</h1>
        <p className="max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
