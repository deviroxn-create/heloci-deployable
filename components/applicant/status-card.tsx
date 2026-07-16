import { Sparkles, ShieldCheck, Clock3, FileText } from "lucide-react";

const cards = [
  {
    title: "Active applications",
    value: "2",
    detail: "Applications in review",
    icon: Sparkles,
    accent: "bg-brand/10 text-brand"
  },
  {
    title: "Approved",
    value: "1",
    detail: "Ready to move forward",
    icon: ShieldCheck,
    accent: "bg-success/10 text-success"
  },
  {
    title: "Pending documents",
    value: "3",
    detail: "Uploads still needed",
    icon: FileText,
    accent: "bg-warning/10 text-warning"
  },
  {
    title: "Waiting on staff",
    value: "1",
    detail: "Response required",
    icon: Clock3,
    accent: "bg-slate-100 text-slate-900"
  }
];

export function StatusCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.title} className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${card.accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>
          </article>
        );
      })}
    </div>
  );
}
