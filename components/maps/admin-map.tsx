"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap as useLeafletMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Property } from "@/types/property";
import "leaflet/dist/leaflet.css";
import { createMapMarkerIcon, MarkerStatus } from "@/components/maps/map-marker";
import { tileLayerAttribution, tileLayerUrl, defaultMapCenter, defaultMapZoom } from "@/lib/maps/map-config";

interface AdminMapProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (property: Property) => void;
}

function hasValidCoordinates(property: Property) {
  return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}

function SelectedPropertyZoom({ property }: { property: Property | null }) {
  const map = useLeafletMap();

  useEffect(() => {
    if (!property || !hasValidCoordinates(property)) return;
    map.flyTo([property.latitude!, property.longitude!], 12, { duration: 0.7 });
  }, [map, property]);

  return null;
}

function deriveAdminStatus(status: string): MarkerStatus {
  const normalized = status?.toLowerCase() ?? "available";
  if (normalized.includes("occup")) return "occupied";
  if (normalized.includes("wait")) return "waitlist";
  return "available";
}

export function AdminMap({ properties, selectedPropertyId, onSelectProperty }: AdminMapProps) {
  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  const center = useMemo<LatLngExpression>(() => {
    if (selectedProperty && hasValidCoordinates(selectedProperty)) {
      return [selectedProperty.latitude!, selectedProperty.longitude!];
    }

    const validProperties = properties.filter(hasValidCoordinates);
    if (!validProperties.length) {
      return defaultMapCenter as LatLngExpression;
    }

    const average = validProperties.reduce(
      (acc, property) => {
        acc[0] += property.latitude!;
        acc[1] += property.longitude!;
        return acc;
      },
      [0, 0]
    );
    return [average[0] / validProperties.length, average[1] / validProperties.length];
  }, [properties, selectedProperty]);

  return (
    <div className="overflow-hidden rounded-[32px] border border-border bg-white shadow-soft">
      <MapContainer center={center} zoom={selectedProperty ? 12 : defaultMapZoom} scrollWheelZoom={false} className="h-[720px] w-full" zoomControl={true}>
        <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />
        {properties.filter(hasValidCoordinates).map((property) => {
          const isSelected = property.id === selectedPropertyId;
          return (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={createMapMarkerIcon(deriveAdminStatus(property.status), isSelected)}
              eventHandlers={{ click: () => onSelectProperty(property) }}
            >
              <Popup>
                <div className="w-72 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-soft">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">{property.status}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{property.title}</p>
                  <p className="mt-2">{property.address}, {property.city}</p>
                  <p className="mt-3 text-sm text-slate-600">Rent ${property.rent}/mo · {property.bedrooms} beds · {property.bathrooms} baths</p>
                  <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Inspect or edit</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <SelectedPropertyZoom property={selectedProperty} />
      </MapContainer>
    </div>
  );
}
