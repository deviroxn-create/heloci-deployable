import { ReactNode } from "react";

type AuthCardProps = {
  heading: string;
  description: string;
  children: ReactNode;
};

export function AuthCard({ heading, description, children }: AuthCardProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">{heading}</h1>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
