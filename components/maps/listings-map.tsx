"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap as useLeafletMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ClusterLayer } from "@/components/maps/cluster-layer";
import { MapPopup } from "@/components/maps/map-popup";
import { createMapMarkerIcon, MarkerStatus } from "@/components/maps/map-marker";
import type { Property } from "@/types/property";
import { tileLayerAttribution, tileLayerUrl, defaultMapCenter, defaultMapZoom } from "@/lib/maps/map-config";

interface ListingsMapProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (property: Property) => void;
  onHoverProperty: (propertyId: string | null) => void;
}

function hasValidCoordinates(property: Property) {
  return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}

function SelectedPropertyFocus({ property, zoom }: { property: Property | null; zoom: number }) {
  const map = useLeafletMap();

  useEffect(() => {
    if (!property || !hasValidCoordinates(property)) {
      return;
    }

    map.flyTo([property.latitude!, property.longitude!], zoom, {
      duration: 0.7
    });
  }, [property, map, zoom]);

  return null;
}

function deriveStatus(status: string): MarkerStatus {
  const normalized = status?.toLowerCase() ?? "available";
  if (normalized.includes("occup")) return "occupied";
  if (normalized.includes("wait")) return "waitlist";
  return "available";
}

export function ListingsMap({ properties, selectedPropertyId, onSelectProperty, onHoverProperty }: ListingsMapProps) {
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
      return defaultMapCenter;
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
      <MapContainer
        center={center}
        zoom={selectedProperty ? 13 : defaultMapZoom}
        scrollWheelZoom={false}
        className="h-[680px] min-h-[420px] w-full"
        doubleClickZoom={false}
        zoomControl={true}
      >
        <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />
        <ClusterLayer>
          {properties.filter(hasValidCoordinates).map((property) => {
            const isSelected = property.id === selectedPropertyId;
            return (
              <Marker
                key={property.id}
                position={[property.latitude!, property.longitude!]}
                icon={createMapMarkerIcon(deriveStatus(property.status), isSelected)}
                eventHandlers={{
                  click: () => onSelectProperty(property),
                  mouseover: () => onHoverProperty(property.id),
                  mouseout: () => onHoverProperty(null)
                }}
              >
                <Popup>
                  <MapPopup property={property} />
                </Popup>
              </Marker>
            );
          })}
        </ClusterLayer>
        <SelectedPropertyFocus property={selectedProperty} zoom={13} />
      </MapContainer>
    </div>
  );
}
