import { ShieldCheck, Lock, Shield } from "lucide-react";

const indicators = [
  {
    label: "Secure authentication",
    description: "Your sign-in is protected with industry-standard encryption.",
    icon: ShieldCheck
  },
  {
    label: "Encrypted connection",
    description: "Data is transmitted over a secure SSL connection.",
    icon: Lock
  },
  {
    label: "Privacy protected",
    description: "Heloci keeps your information safe and private.",
    icon: Shield
  }
];

export function SecurityIndicators() {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-3">
      {indicators.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-[20px] border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
