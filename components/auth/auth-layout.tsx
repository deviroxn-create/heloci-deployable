import Image from "next/image";
import Link from "next/link";
import { MiniFooter } from "@/components/auth/mini-footer";
import { ReactNode } from "react";

const stats = [
  { value: "2,500+", label: "Families Assisted" },
  { value: "120+", label: "Housing Programs" },
  { value: "98%", label: "Support Satisfaction" }
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-slate-950">
      <div className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold text-slate-950">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10 text-brand shadow-sm">
              <Image src="/heloci-logo.svg" alt="Heloci logo" width={28} height={28} />
            </div>
            <span>Heloci</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/help" className="transition hover:text-slate-950">
              Help Center
            </Link>
            <Link href="/contact" className="transition hover:text-slate-950">
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1440px] flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand to-brandHover p-8 text-white shadow-soft lg:flex-1 lg:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 bottom-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex h-full flex-col justify-center gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-[20px] border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                Trusted housing support
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Find safe housing with confidence
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-100/90 sm:text-lg">
                Connect with trusted housing programs, eligibility support, and dedicated case workers.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-6 shadow-sm backdrop-blur-sm">
                  <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-100/85">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex-1 lg:flex-[1_1_50%]">
          <div className="mx-auto max-w-[460px]">{children}</div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
        <MiniFooter />
      </footer>
    </div>
  );
}
