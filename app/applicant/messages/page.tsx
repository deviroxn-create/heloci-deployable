import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const conversations = [
  {
    id: "MSG-001",
    from: "Case manager",
    preview: "Please upload your most recent pay stub so we can finish verification.",
    time: "1h ago",
    unread: true
  },
  {
    id: "MSG-002",
    from: "Heloci support",
    preview: "Your veteran housing application has been approved. Next steps are scheduling a move-in call.",
    time: "2 days ago",
    unread: false
  }
];

export default function Page() {
  return (
    <ApplicantShell
      title="Messages"
      description="Keep your support conversations organized and respond quickly to staff requests.">
      <div className="space-y-8">
        <section className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand">Inbox</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Latest messages</h2>
            </div>
            <Button variant="outline">Compose message</Button>
          </div>
          <div className="mt-8 space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className={`rounded-[28px] border ${conversation.unread ? "border-brand/20 bg-brand/10" : "border-border bg-slate-50"} p-5`}> 
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{conversation.from}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{conversation.preview}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{conversation.time}</p>
                    {conversation.unread ? <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">Unread</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] bg-slate-50 p-8 shadow-soft">
          <div className="flex items-center gap-3 text-brand">
            <MessageSquare className="h-5 w-5" />
            <p className="text-sm uppercase tracking-[0.24em]">Communication tips</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Respond quickly</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">Answer staff questions within 24 hours to keep your review on schedule.</p>
            </div>
            <div className="rounded-[28px] bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Share details clearly</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">Include program name or document name in replies so your case manager can support you faster.</p>
            </div>
          </div>
        </section>
      </div>
    </ApplicantShell>
  );
}
