import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[520px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-3 text-base font-semibold text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#006AFF]/10 shadow-sm">
              <Image src="/heloci-logo.svg" alt="Heloci logo" width={24} height={24} />
            </div>
            <span>Heloci</span>
          </Link>
          <Link href="/help" className="text-sm text-slate-600 transition hover:text-slate-900">
            Help
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[520px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
