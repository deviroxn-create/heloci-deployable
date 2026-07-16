"use client";
import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ClusterLayer } from "@/components/maps/cluster-layer";
import { MapPopup } from "@/components/maps/map-popup";
import { createMapMarkerIcon, MarkerStatus } from "@/components/maps/map-marker";
import type { Property } from "@/types/property";
import { defaultMapCenter, defaultMapZoom, tileLayerAttribution, tileLayerUrl } from "@/lib/maps/map-config";

const deriveStatus = (status: string): MarkerStatus => {
  const normalized = status?.toLowerCase() ?? "available";
  if (normalized.includes("occup")) return "occupied";
  if (normalized.includes("wait")) return "waitlist";
  return "available";
};

function hasValidCoordinates(property: Property) {
  return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}

export function PropertyMap({ properties }: { properties: Property[] }) {
  const center = useMemo<LatLngExpression>(() => {
    const validProperties = properties.filter(hasValidCoordinates);
    if (!validProperties.length) {
      return defaultMapCenter;
    }

    const [latSum, lngSum] = validProperties.reduce(
      (acc, property) => [acc[0] + property.latitude!, acc[1] + property.longitude!],
      [0, 0]
    );

    return [latSum / validProperties.length, lngSum / validProperties.length];
  }, [properties]);

  return (
    <div className="overflow-hidden rounded-[32px] border border-border bg-white shadow-soft">
      <MapContainer center={center} zoom={defaultMapZoom} scrollWheelZoom={false} className="h-[420px] w-full" zoomControl={false}>
        <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />
        <ClusterLayer>
          {properties.filter(hasValidCoordinates).map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={createMapMarkerIcon(deriveStatus(property.status))}
            >
              <Popup>
                <MapPopup property={property} />
              </Popup>
            </Marker>
          ))}
        </ClusterLayer>
      </MapContainer>
    </div>
  );
}
