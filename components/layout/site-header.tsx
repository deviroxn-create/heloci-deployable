"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bell, ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Find Housing", href: "/properties" },
  { label: "Eligibility Checker", href: "/eligibility" }
];

const programs = [
  { label: "Rental Assistance", goal: "Rental Assistance" },
  { label: "Affordable Rent", goal: "Affordable Rent" },
  { label: "Emergency Housing", goal: "Emergency Housing" },
  { label: "Family Housing", goal: "Family Housing" },
  { label: "Veteran Housing", goal: "Veteran Housing" },
  { label: "Disability Housing", goal: "Disability Housing" },
  { label: "Teacher Housing", goal: "Teacher Housing" },
  { label: "Healthcare Worker Housing", goal: "Healthcare Worker Housing" },
  { label: "First-Time Homebuyer", goal: "Buy My First Home" },
  { label: "Mortgage Assistance", goal: "Mortgage Assistance" },
  { label: "Senior Housing", goal: "Senior Housing" },
  { label: "Student Housing", goal: "Student Housing" },
  { label: "Domestic Violence Support", goal: "Domestic Violence Support" },
  { label: "Rent to Own", goal: "Rent to Own" },
  { label: "Accessible Housing", goal: "Accessible Housing" }
];

const resources = [
  { label: "FAQ", href: "/contact#faq" },
  { label: "Guides", href: "/about#guides" },
  { label: "Documents", href: "/eligibility#documents" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Detect auth state on mount and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Handle Escape key to close drawer and manage body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };

    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [drawerOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDrawerOpen(false);
    router.push("/");
  };

  const isSignedIn = !authLoading && session !== null;

  // Derive dashboard href from user metadata / session
  // We redirect to applicant by default; role-based redirect is handled by layouts
  const dashboardHref = "/applicant/dashboard";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/95 shadow-sm transition duration-300">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-8">

        {/* ── Left: logo + nav ── */}
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap text-lg font-semibold tracking-tight text-slate-950">
            <Image src="/heloci-logo.svg" alt="Heloci logo" width={40} height={40} className="rounded-2xl" />
            Heloci
          </Link>

          <nav className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium text-slate-700 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-brand ${
                  pathname === item.href ? "text-brand" : "text-slate-700"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Programs dropdown */}
              <div className="group relative">
              <button
                type="button"
                  className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand"
              >
                Programs <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 mt-3 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-[28px] border border-slate-200 bg-white p-5 opacity-0 shadow-[0_20px_60px_rgba(15,23,42,0.16)] transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Housing programs</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">Find support for your next step</p>
                  </div>
                  <Link href="/programs" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:text-brandHover">
                    View all programs <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {programs.map((item) => (
                    <Link key={item.goal} href={`/programs?goal=${encodeURIComponent(item.goal)}`} className="rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-brand/20 hover:bg-brand/5 hover:text-brand">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Resources dropdown */}
            <div className="group relative">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand"
              >
                Resources <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-0 top-full mt-2 w-56 rounded-3xl border border-border bg-white p-3 shadow-soft transition duration-200 group-hover:visible group-focus-within:visible">
                {resources.map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* ── Right: auth-aware actions (desktop) ── */}
        <div className="hidden items-center gap-3 lg:flex">
          {authLoading ? (
            // Skeleton placeholder while session loads
            <div className="h-9 w-40 animate-pulse rounded-full bg-slate-100" />
          ) : isSignedIn ? (
            /* ── SIGNED IN ── */
            <>
              {/* Notifications */}
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-slate-700 transition hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>

              {/* Applicant account link */}
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
              >
                <LayoutDashboard className="h-4 w-4" />
                My Account
              </Link>

              {/* User avatar + email */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white pl-1 pr-4 py-1">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {userInitial}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">{userEmail}</span>
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-error/40 hover:text-error"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            /* ── NOT SIGNED IN ── */
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-slate-700 transition hover:bg-slate-100 lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          >
            <motion.div
              className="fixed right-0 top-0 z-[70] h-full w-[min(320px,calc(100vw-1rem))] max-w-full overflow-y-auto bg-white px-6 py-6 shadow-soft"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between pb-6">
                <Link 
                  id="mobile-menu-title"
                  href="/" 
                  onClick={() => setDrawerOpen(false)} 
                  className="flex items-center gap-3 text-lg font-semibold text-slate-950"
                >
                  <Image src="/heloci-logo.svg" alt="Heloci logo" width={36} height={36} className="rounded-2xl" />
                  Heloci
                </Link>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-slate-700"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl border border-border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Programs</p>
                  <div className="mt-3 space-y-1">
                    {programs.map((item) => (
                      <Link key={item.goal} href={`/programs?goal=${encodeURIComponent(item.goal)}`} className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white" onClick={() => setDrawerOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                    <Link href="/programs" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-white" onClick={() => setDrawerOpen(false)}>
                      View all programs <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</p>
                  <div className="mt-3 space-y-1">
                    {resources.map((item) => (
                      <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white" onClick={() => setDrawerOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auth section at bottom of drawer */}
              <div className="mt-6 border-t border-border pt-6 space-y-3">
                {isSignedIn ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 rounded-2xl bg-brand/5 px-4 py-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                        {userInitial}
                      </div>
                      <p className="truncate text-sm font-medium text-slate-900">{userEmail}</p>
                    </div>

                    <Link
                      href={dashboardHref}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-2 justify-center rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand" />
                      My Account
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 justify-center rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brandHover"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
