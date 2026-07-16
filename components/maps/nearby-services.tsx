"use client";

import { Bus, HeartPulse, Pill, School2, ShoppingCart } from "lucide-react";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";

const categories = [
  { key: "schools", label: "Schools", icon: School2 },
  { key: "hospitals", label: "Hospitals", icon: HeartPulse },
  { key: "transit", label: "Transit", icon: Bus },
  { key: "groceries", label: "Groceries", icon: ShoppingCart },
  { key: "pharmacies", label: "Pharmacies", icon: Pill }
] as const;

export function NearbyServices({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { services, loading, error } = useNearbyPlaces(latitude, longitude, Boolean(latitude && longitude));

  return (
    <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand">Nearby services</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Local supports around the property</h2>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-600">Loading nearby services…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-slate-600">Unable to load nearby services. Please try again later.</p>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {categories.map((category) => {
            const list = services[category.key];
            const Icon = category.icon;
            return (
              <div key={category.key} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{category.label}</p>
                    <p className="text-sm text-slate-500">Closest {category.label.toLowerCase()}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {list.length ? (
                    list.slice(0, 4).map((entry) => (
                      <div key={entry.id} className="rounded-3xl bg-white px-4 py-3 shadow-sm">
                        <p className="font-semibold text-slate-950">{entry.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{entry.address ?? "Nearby location"}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{Math.round(entry.distanceMeters)} m away</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No nearby {category.label.toLowerCase()} found within range.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
