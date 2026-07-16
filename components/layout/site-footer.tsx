import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white pt-16 pb-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:px-8">
        <div className="space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 shadow-soft">
            <Image src="/heloci-logo.svg" alt="Heloci logo" width={48} height={48} className="rounded-3xl" />
          </div>
          <p className="max-w-sm text-sm leading-7 text-slate-600">
            Heloci helps families and individuals connect with verified housing support, eligibility guidance, and trusted NGO case workers.
          </p>
          <div className="flex items-center gap-3 text-slate-600">
            <Link href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-slate-700 transition hover:border-brand hover:text-brand">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-slate-700 transition hover:border-brand hover:text-brand">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-slate-700 transition hover:border-brand hover:text-brand">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border text-slate-700 transition hover:border-brand hover:text-brand">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Platform</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <Link href="/(marketing)/properties" className="transition hover:text-brand">
                Find Housing
              </Link>
            </li>
            <li>
              <Link href="/(marketing)/eligibility" className="transition hover:text-brand">
                Eligibility Checker
              </Link>
            </li>
            <li>
              <Link href="/applicant/applications" className="transition hover:text-brand">
                Applications
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Programs</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <Link href="/(marketing)/properties?program=family" className="transition hover:text-brand">
                Family Housing
              </Link>
            </li>
            <li>
              <Link href="/(marketing)/properties?program=emergency" className="transition hover:text-brand">
                Emergency Housing
              </Link>
            </li>
            <li>
              <Link href="/(marketing)/properties?program=veterans" className="transition hover:text-brand">
                Veteran Housing
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Support</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <Link href="/(marketing)/contact" className="transition hover:text-brand">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/(marketing)/contact" className="transition hover:text-brand">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/(marketing)/contact#faq" className="transition hover:text-brand">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-900">Legal</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <Link href="#" className="transition hover:text-brand">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-brand">
                Terms
              </Link>
            </li>
            <li>
              <Link href="#" className="transition hover:text-brand">
                Accessibility
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1440px] flex-col gap-4 border-t border-border px-4 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">
        <p>© {new Date().getFullYear()} Heloci. Trusted housing support for communities and NGOs.</p>
        <Link href="/(marketing)/contact" className="inline-flex items-center gap-2 text-slate-700 transition hover:text-brand">
          <span>Join our newsletter</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </footer>
  );
}
