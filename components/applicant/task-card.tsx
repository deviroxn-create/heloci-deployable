import { Clock3, FileText, MessageSquare, CheckCircle2 } from "lucide-react";

const tasks = [
  {
    title: "Upload proof of income",
    description: "Required for housing verification.",
    status: "Pending",
    icon: FileText,
    color: "text-warning"
  },
  {
    title: "Review application response",
    description: "Staff will update you once review is complete.",
    status: "In progress",
    icon: Clock3,
    color: "text-brand"
  },
  {
    title: "Check message from case manager",
    description: "A new note is waiting in your inbox.",
    status: "Unread",
    icon: MessageSquare,
    color: "text-slate-900"
  },
  {
    title: "Confirm address details",
    description: "Review your property preference for accuracy.",
    status: "Complete",
    icon: CheckCircle2,
    color: "text-success"
  }
];

export function TaskCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tasks.map((task) => {
        const Icon = task.icon;
        return (
          <article key={task.title} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-50 text-slate-900">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${task.color}`}>{task.status}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
