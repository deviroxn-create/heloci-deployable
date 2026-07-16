import { User, Bell, ShieldCheck, Trash2 } from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";

export default function ApplicantSettingsPage() {
  return (
    <ApplicantShell
      title="Settings"
      description="Manage your account, notification preferences, and privacy controls."
    >
      <div className="space-y-6">
        {/* Profile */}
        <section className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Profile information</h2>
              <p className="text-xs text-slate-500">Your name and contact details</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="full-name">Full name</label>
              <input id="full-name" type="text" placeholder="Your full name" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="you@example.com" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" placeholder="(555) 000-0000" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="city">City</label>
              <input id="city" type="text" placeholder="Your city" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
          </div>
          <Button size="sm" className="mt-5">Save profile</Button>
        </section>

        {/* Notifications */}
        <section className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Notifications</h2>
              <p className="text-xs text-slate-500">Choose when Heloci sends you updates</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Application status updates", enabled: true },
              { label: "New messages from staff", enabled: true },
              { label: "Document upload reminders", enabled: true },
              { label: "Weekly progress summary", enabled: false },
              { label: "Marketing and announcements", enabled: false }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-3.5">
                <span className="text-sm text-slate-700">{item.label}</span>
                <div
                  className={`relative h-5 w-9 rounded-full cursor-pointer transition ${item.enabled ? "bg-brand" : "bg-slate-200"}`}
                  role="switch"
                  aria-checked={item.enabled}
                  tabIndex={0}
                >
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Security</h2>
              <p className="text-xs text-slate-500">Password and account access controls</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="new-password">New password</label>
              <input id="new-password" type="password" placeholder="New password" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" placeholder="Confirm new password" className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4">Update password</Button>
        </section>

        {/* Danger zone */}
        <section className="rounded-[32px] border border-error/20 bg-error/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10 text-error">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Danger zone</h2>
              <p className="text-xs text-slate-500">Permanent and irreversible account actions</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Delete account</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently remove your account, applications, and uploaded documents. This cannot be undone.</p>
            </div>
            <button type="button" className="shrink-0 rounded-2xl border border-error/30 bg-error/5 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/10">
              Delete account
            </button>
          </div>
        </section>
      </div>
    </ApplicantShell>
  );
}
