import { AdminShell } from "@/components/admin/admin-shell";
import { CommunicationDashboard } from "@/components/admin/communication-dashboard";
import { getCommunicationDashboardDataAction, retryFailedNotificationsAction } from "@/actions/notifications.actions";
// Link not used in this file

const metricCards = [
  { key: "total", label: "Total Notifications" },
  { key: "today", label: "Today's Notifications" },
  { key: "failed", label: "Failed" },
  { key: "pending", label: "Pending" },
  { key: "delivered", label: "Delivered" },
  { key: "read", label: "Read" }
] as const;

export default async function CommunicationsPage() {
  const data = await getCommunicationDashboardDataAction();

  return (
    <AdminShell title="Communication Center" description="Monitor notifications, templates, delivery state, and retries from a single enterprise dashboard.">
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Communication Dashboard</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Enterprise-ready communication monitoring</h2>
          </div>
          <form action={retryFailedNotificationsAction}>
            <button className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
              Retry All Failed
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((card) => (
            <div key={card.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{data.stats[card.key as keyof typeof data.stats]}</p>
            </div>
          ))}
        </div>

        <CommunicationDashboard logs={data.logs} templates={data.templates} />
      </div>
    </AdminShell>
  );
}
