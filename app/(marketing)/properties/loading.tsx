import { PageShell } from "@/components/shared/page-shell";

export default function PropertyDiscoveryLoading() {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading property listings</span>
        <div className="h-48 animate-pulse rounded-[32px] bg-slate-200" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-[380px] animate-pulse rounded-[24px] bg-slate-200" />)}
        </div>
      </div>
    </PageShell>
  );
}
