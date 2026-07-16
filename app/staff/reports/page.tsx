import { TrendingDown, TrendingUp, Clock3 } from "lucide-react";
import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";

const personalStats = [
  { label: "Cases resolved this month", value: "9", change: "+3 vs last month", trend: "up" },
  { label: "Avg. time to first response", value: "2.8h", change: "-0.4h vs last month", trend: "up" },
  { label: "Avg. time to decision", value: "4.6 days", change: "-0.9 days", trend: "up" },
  { label: "Pending cases", value: "3", change: "Same as last month", trend: "neutral" }
];

const weeklyActivity = [
  { day: "Mon", cases: 4 },
  { day: "Tue", cases: 7 },
  { day: "Wed", cases: 3 },
  { day: "Thu", cases: 6 },
  { day: "Fri", cases: 5 },
  { day: "Sat", cases: 1 },
  { day: "Sun", cases: 0 }
];

const maxCases = Math.max(...weeklyActivity.map((d) => d.cases));

function getBarHeightClass(cases: number) {
  if (cases <= 0) return "h-2";
  if (cases <= 2) return "h-8";
  if (cases <= 4) return "h-16";
  if (cases <= 6) return "h-24";
  return "h-32";
}

function getBarWidthClass(percent: number) {
  if (percent <= 0) return "w-0";
  if (percent <= 25) return "w-1/4";
  if (percent <= 50) return "w-1/2";
  if (percent <= 75) return "w-3/4";
  return "w-full";
}

export default function StaffReportsPage() {
  return (
    <StaffShell
      title="My reports"
      description="Personal performance metrics, case throughput, and resolution trends."
      actions={<Button size="sm" variant="outline">Export</Button>}
    >
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {personalStats.map((stat) => (
          <div key={stat.label} className="rounded-[28px] border border-border bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1">
              {stat.trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : stat.trend === "down" ? (
                <TrendingDown className="h-3.5 w-3.5 text-error" />
              ) : null}
              <span className="text-xs text-slate-500">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Weekly bar chart */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Activity</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Cases handled this week</h2>
          <div className="mt-6 flex items-end justify-between gap-3 h-36">
            {weeklyActivity.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-xl transition-all ${day.cases > 0 ? "bg-brand" : "bg-slate-100"} ${getBarHeightClass(day.cases)}`}
                  title={`${day.cases} cases`}
                />
                <span className="text-xs text-slate-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome breakdown */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Outcomes</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">My case results</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: "Approved", value: 18, color: "bg-success", pct: 75 },
              { label: "Rejected", value: 3, color: "bg-error", pct: 12.5 },
              { label: "Waitlisted", value: 3, color: "bg-slate-300", pct: 12.5 }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-950">{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.color} ${getBarWidthClass(item.pct)}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottlenecks */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Bottlenecks</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Where cases get delayed</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { stage: "Document collection", avgDays: "2.4 days", note: "Applicants slow to upload" },
            { stage: "Income verification", avgDays: "1.8 days", note: "Typically clears quickly" },
            { stage: "Final review", avgDays: "0.8 days", note: "Fastest stage" }
          ].map((item) => (
            <div key={item.stage} className="rounded-[24px] bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-brand">
                <Clock3 className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">{item.stage}</p>
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-950">{item.avgDays}</p>
              <p className="mt-1 text-xs text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </StaffShell>
  );
}
