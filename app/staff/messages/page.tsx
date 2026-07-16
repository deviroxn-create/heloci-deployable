import { Send } from "lucide-react";
import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";

const conversations = [
  {
    id: "MSG-001",
    applicant: "Amara Singh",
    applicationId: "APP-5412",
    preview: "I uploaded my pay stub. Can you please confirm?",
    time: "30m ago",
    unread: true,
    messages: [
      { from: "Amara Singh", text: "Hi, I just uploaded my pay stub. Can you please confirm receipt?", time: "30m ago", isStaff: false },
      { from: "You", text: "Hi Amara, I can see the upload. I'll review it shortly and update your application.", time: "20m ago", isStaff: true }
    ]
  },
  {
    id: "MSG-002",
    applicant: "Carlos Reyes",
    applicationId: "APP-5411",
    preview: "Thank you for the update. I'll send the form today.",
    time: "2h ago",
    unread: true,
    messages: [
      { from: "You", text: "Hi Carlos, please complete the DD-214 and upload it to your application.", time: "3h ago", isStaff: true },
      { from: "Carlos Reyes", text: "Thank you for the update. I'll send the form today.", time: "2h ago", isStaff: false }
    ]
  },
  {
    id: "MSG-003",
    applicant: "Priya Patel",
    applicationId: "APP-5408",
    preview: "Sorry for the delay. I'm having trouble with the upload.",
    time: "1 day ago",
    unread: false,
    messages: [
      { from: "Priya Patel", text: "Sorry for the delay. I'm having trouble uploading my documents.", time: "1 day ago", isStaff: false }
    ]
  }
];

export default function StaffMessagesPage() {
  const active = conversations[0];

  return (
    <StaffShell
      title="Staff inbox"
      description="Communicate with applicants and keep every case conversation organized."
    >
      <div className="rounded-[28px] border border-border bg-white shadow-soft overflow-hidden">
        <div className="grid min-h-[520px] xl:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div className="border-r border-border">
            <div className="border-b border-border px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Conversations</p>
            </div>
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className={`w-full px-4 py-4 text-left transition hover:bg-slate-50 ${conv.id === active.id ? "bg-brand/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand">
                        {conv.applicant.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950 truncate">{conv.applicant}</p>
                        <p className="text-xs text-slate-500">{conv.applicationId}</p>
                      </div>
                    </div>
                    {conv.unread ? (
                      <span className="shrink-0 inline-flex h-2 w-2 rounded-full bg-brand mt-1.5" />
                    ) : null}
                  </div>
                  <p className="mt-2 ml-12 text-xs text-slate-500 truncate">{conv.preview}</p>
                  <p className="mt-1 ml-12 text-xs text-slate-400">{conv.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active conversation */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand">
                {active.applicant.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">{active.applicant}</p>
                <p className="text-xs text-slate-500">{active.applicationId}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {active.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isStaff ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-[20px] px-4 py-3 text-sm leading-6 ${msg.isStaff ? "bg-brand text-white rounded-br-md" : "bg-slate-100 text-slate-900 rounded-bl-md"}`}>
                    <p>{msg.text}</p>
                    <p className={`mt-1.5 text-xs ${msg.isStaff ? "text-white/60" : "text-slate-500"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose */}
            <div className="border-t border-border p-4">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  placeholder="Type a message to the applicant…"
                  className="flex-1 resize-none rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  aria-label="Compose message"
                />
                <Button size="sm" className="shrink-0 h-11">
                  <Send className="h-4 w-4 mr-1.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
