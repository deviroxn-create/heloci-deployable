"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createMapMarkerIcon, MarkerStatus } from "@/components/maps/map-marker";
import type { Property } from "@/types/property";
import { tileLayerAttribution, tileLayerUrl, defaultMapZoom } from "@/lib/maps/map-config";

function deriveStatus(status: string): MarkerStatus {
  const normalized = status?.toLowerCase() ?? "available";
  if (normalized.includes("occup")) return "occupied";
  if (normalized.includes("wait")) return "waitlist";
  return "available";
}

export function PropertyDetailsMap({ property }: { property: Property }) {
  const center = [property.latitude, property.longitude] as LatLngExpression;

  return (
    <div className="overflow-hidden rounded-[32px] border border-border bg-white shadow-soft">
      <MapContainer center={center} zoom={defaultMapZoom} scrollWheelZoom={false} className="h-[520px] w-full">
        <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />
        <Marker position={center} icon={createMapMarkerIcon(deriveStatus(property.status), true)} />
      </MapContainer>
    </div>
  );
}
