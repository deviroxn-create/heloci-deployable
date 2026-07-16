import { ClipboardList, MessageSquare, Clock3, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Assigned cases", value: "12", detail: "3 need urgent action", accent: "bg-brand/10 text-brand", icon: ClipboardList },
  { title: "Resolved this month", value: "9", detail: "On track", accent: "bg-success/10 text-success", icon: CheckCircle2 },
  { title: "Unread messages", value: "5", detail: "2 require response", accent: "bg-warning/10 text-warning", icon: MessageSquare },
  { title: "Avg. response time", value: "3.1h", detail: "Target: <4h", accent: "bg-info/10 text-info", icon: Clock3 }
];

const priorityCases = [
  { id: "APP-5412", name: "Amara Singh", program: "Family Housing", issue: "Awaiting income documents", urgency: "High" },
  { id: "APP-5411", name: "Carlos Reyes", program: "Veteran Housing", issue: "Identity verification incomplete", urgency: "Medium" },
  { id: "APP-5408", name: "Priya Patel", program: "Transitional Housing", issue: "No response in 72 hours", urgency: "High" }
];

const messages = [
  { from: "Amara Singh", preview: "I uploaded my pay stub. Can you please confirm?", time: "30m ago", unread: true },
  { from: "Carlos Reyes", preview: "Thank you for the update, I'll send the form today.", time: "2h ago", unread: true },
  { from: "Priya Patel", preview: "Sorry for the delay. I'm having trouble with the upload.", time: "1 day ago", unread: false }
];

export default function StaffDashboardPage() {
  return (
    <StaffShell
      title="Staff dashboard"
      description="Your daily case overview, priority actions, and active conversations."
      actions={
        <Link href="/staff/applications">
          <Button size="sm">View all cases</Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl ${stat.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.title}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Priority cases */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Priority queue</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Cases needing action</h2>
            </div>
            <Link href="/staff/applications">
              <Button variant="outline" size="sm">All cases</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {priorityCases.map((c) => (
              <div key={c.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-border text-xs font-bold text-slate-700 shadow-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.id} · {c.program}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${c.urgency === "High" ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}`}>
                    {c.urgency}
                  </span>
                </div>
                <p className="mt-2 ml-12 text-sm text-slate-600">{c.issue}</p>
                <div className="mt-3 ml-12 flex gap-2">
                  <button type="button" className="rounded-xl bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20">Review case</button>
                  <button type="button" className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Send message</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Inbox</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent messages</h2>
            </div>
            <Link href="/staff/messages">
              <button type="button" className="text-xs font-semibold text-brand hover:underline">View all</button>
            </Link>
          </div>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.from} className={`rounded-2xl px-4 py-3.5 ${msg.unread ? "bg-brand/5 border border-brand/10" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{msg.from}</p>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{msg.preview}</p>
                {msg.unread ? <span className="mt-2 inline-flex rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Unread</span> : null}
              </div>
            ))}
          </div>
          <Link href="/staff/messages" className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
            Open inbox <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </StaffShell>
  );
}
