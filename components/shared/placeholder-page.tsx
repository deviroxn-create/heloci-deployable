import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/shared/page-shell";
import { ArrowRight } from "lucide-react";

type Action = {
  label: string;
  href: string;
  primary?: boolean;
};

interface PlaceholderPageProps {
  title: string;
  description: string;
  highlights?: string[];
  actions?: Action[];
  children?: ReactNode;
}

export function PlaceholderPage({ title, description, highlights = [], actions = [], children }: PlaceholderPageProps) {
  return (
    <PageShell title={title}>
      <div className="space-y-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-brand/5 via-surface to-white p-8 shadow-overlay">
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-full bg-brand/5 px-4 py-2 text-sm font-semibold text-brand">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand text-white">H</span>
              Production-ready scaffold
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
            </div>
            {highlights.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {children}

        {actions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                  action.primary ? "bg-brand text-white hover:bg-brandHover" : "border border-border bg-white text-slate-950 hover:bg-slate-50"
                }`}
              >
                {action.label}
                {action.primary ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
