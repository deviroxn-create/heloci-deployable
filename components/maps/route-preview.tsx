"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import { MapPin } from "lucide-react";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRoutePreview } from "@/lib/maps/distance";
import { tileLayerAttribution, tileLayerUrl, defaultMapZoom } from "@/lib/maps/map-config";

const destinations = [
  { key: "school", label: "School", coords: [37.7797, -122.4270] as LatLngExpression },
  { key: "work", label: "Work", coords: [37.7896, -122.4104] as LatLngExpression },
  { key: "hospital", label: "Hospital", coords: [37.7649, -122.4242] as LatLngExpression }
] as const;

export function RoutePreview({ origin }: { origin: [number, number] }) {
  const [destinationKey, setDestinationKey] = useState<"school" | "work" | "hospital">(destinations[0].key);
  const [route, setRoute] = useState<{ coordinates: LatLngExpression[]; distance: number; duration: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = useMemo(() => destinations.find((item) => item.key === destinationKey) ?? destinations[0], [destinationKey]);

  useEffect(() => {
    let mounted = true;
    setRoute(null);
    setLoading(true);
    setError(null);

    const destCoords = destination.coords as unknown as [number, number];
    getRoutePreview([origin[0], origin[1]], [destCoords[0], destCoords[1]])
      .then((result) => {
        if (!mounted) return;
        if (!result) {
          setError("Unable to load route preview.");
          return;
        }
        setRoute(result);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Unable to load route preview.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [destination, origin]);

  return (
    <div className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-brand">Route preview</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Estimate travel to neighborhood essentials</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {destinations.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDestinationKey(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${destinationKey === item.key ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_0.6fr]">
        <div className="overflow-hidden rounded-[28px] border border-border bg-slate-50">
          <MapContainer center={origin as LatLngExpression} zoom={defaultMapZoom} scrollWheelZoom={false} className="h-[340px] w-full">
            <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />
            <Marker position={origin as LatLngExpression} />
            <Marker position={destination.coords} />
            {route ? <Polyline pathOptions={{ color: "#003DB8", weight: 4, opacity: 0.9 }} positions={route.coordinates} /> : null}
          </MapContainer>
        </div>

        <div className="rounded-[28px] border border-border bg-white p-5">
          {loading ? (
            <p className="text-sm text-slate-600">Loading route…</p>
          ) : error ? (
            <p className="text-sm text-slate-600">{error}</p>
          ) : route ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-800">
                <MapPin className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Destination</p>
                  <p className="font-semibold text-slate-950">{destination.label}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Distance</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{(route.distance / 1000).toFixed(1)} km</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Travel time</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{Math.round(route.duration / 60)} min</p>
              </div>
              <div className="rounded-3xl bg-brand/5 p-4 text-sm text-slate-700">
                <p className="font-semibold text-brand">Tip</p>
                <p className="mt-2">Choose the destination type most important to your household and compare commute confidence.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Select a route to see travel details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
