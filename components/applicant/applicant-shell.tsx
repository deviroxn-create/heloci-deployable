"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ArrowRight, Building2, Check, ClipboardList, FileText, Home, LogOut, Menu, MessageSquare, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserBadge } from "@/components/shared/user-badge";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  { label: "My Account", href: "/applicant/dashboard", icon: Home },
  { label: "Applications", href: "/applicant/applications", icon: ClipboardList },
  { label: "Available properties", href: "/applicant/properties", icon: Building2 },
  { label: "Documents", href: "/applicant/documents", icon: FileText },
  { label: "Messages", href: "/applicant/messages", icon: MessageSquare },
  { label: "Settings", href: "/applicant/settings", icon: Settings }
];

interface ActionItem {
  label: string;
  href: string;
}

interface ApplicantShellProps {
  title: string;
  description: string;
  actions?: ActionItem[];
  children: ReactNode;
}

export function ApplicantShell({ title, description, actions = [], children }: ApplicantShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="relative grid gap-8 lg:grid-cols-[280px_1fr]">
      <button
        type="button"
        aria-label="Open applicant navigation"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-soft lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close applicant navigation" onClick={() => setMobileNavOpen(false)} className="absolute inset-0 bg-slate-950/40" />
          <aside className="relative h-full w-[min(88vw,340px)] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Applicant hub</p>
              <button type="button" aria-label="Close applicant navigation" onClick={() => setMobileNavOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <ApplicantNavigation pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="hidden space-y-8 rounded-[32px] border border-border bg-white p-6 shadow-soft lg:block">
        <div className="space-y-4">
          <div className="rounded-3xl bg-brand/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Applicant hub</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Track your applications, upload documents, and message staff from one calm place.</p>
          </div>
          <ApplicantNavigation pathname={pathname} />
        </div>

        <div className="rounded-[28px] border border-border bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Need assistance?</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Connect with your case manager or open the AI assistant for fast guidance.</p>
          <Button size="sm" className="mt-4 w-full justify-center">
            Open assistant
          </Button>
        </div>

        <div className="rounded-[28px] border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Next checkpoint</p>
              <p className="mt-2 text-sm text-slate-600">Upload your income verification by Monday.</p>
            </div>
            <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">Due soon</span>
          </div>
        </div>

        {actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="flex items-center justify-between rounded-3xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50">
                {action.label}
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            ))}
          </div>
        ) : null}

        {/* User info + sign out */}
        <div className="rounded-[24px] border border-border bg-white p-4 flex items-center justify-between gap-3">
          <UserBadge />
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <section className="space-y-8">
        <div className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">{title}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/matches">View eligibility</Link>
              </Button>
              <Button asChild>
                <Link href="/apply">New application</Link>
              </Button>
            </div>
          </div>
        </div>

        {children}
      </section>
    </div>
  );
}

function ApplicantNavigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href === "/applicant/properties" && pathname.startsWith("/applicant/properties/"));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${active ? "bg-brand/10 text-brand shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>
            {active ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
