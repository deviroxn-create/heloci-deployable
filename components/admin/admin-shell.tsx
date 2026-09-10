"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  // Sparkles unused
  Users,
  Zap,
  Building2,
  MessagesSquare,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { UserBadge } from "@/components/shared/user-badge";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Applications", href: "/admin/applications", icon: ClipboardList },
  { label: "Properties", href: "/admin/properties", icon: Building2 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Staff", href: "/admin/staff", icon: Home },
  { label: "Automation", href: "/admin/automation", icon: Zap },
  { label: "Communication", href: "/admin/communication", icon: MessagesSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings }
];

interface AdminShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminShell({ title, description, children, actions }: AdminShellProps) {
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
    <div className="min-h-screen bg-surface">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col gap-6 overflow-y-auto border-r border-border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white">
                  H
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">Heloci</p>
                  <p className="text-xs text-slate-500">Admin console</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1" aria-label="Admin navigation">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-brand text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </aside>
        </div>
      ) : null}
      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-6 min-h-screen sticky top-0 border-r border-border bg-white p-6">
          <div className="flex items-center gap-3 px-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-white text-sm font-bold">
              H
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Heloci</p>
              <p className="text-xs text-slate-500">Admin console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        {/* Main */}
        <main className="min-h-screen flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur px-6 py-4">
            <div className="flex items-center justify-between gap-4 max-w-full">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Open navigation"
                  aria-expanded={mobileNavOpen}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Admin</p>
                  <h1 className="text-xl font-semibold text-slate-950 truncate">{title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                {actions}
                <UserBadge />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
              {description ? (
                <p className="text-sm leading-7 text-slate-600 max-w-2xl">{description}</p>
              ) : null}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
