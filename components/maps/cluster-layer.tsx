"use client";

import L from "leaflet";
import type { ReactNode } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import { mapColors, mapClusterOptions } from "@/lib/maps/map-config";

export function ClusterLayer({ children }: { children: ReactNode }) {
  return (
    <MarkerClusterGroup
      chunkedLoading={mapClusterOptions.chunkedLoading}
      maxClusterRadius={mapClusterOptions.maxClusterRadius}
      disableClusteringAtZoom={mapClusterOptions.disableClusteringAtZoom}
      spiderfyOnMaxZoom={mapClusterOptions.spiderfyOnMaxZoom}
      showCoverageOnHover={mapClusterOptions.showCoverageOnHover}
      iconCreateFunction={(cluster: { getChildCount: () => number }) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="width:48px;height:48px;border-radius:24px;background:${mapColors.primary};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;box-shadow:0 16px 30px rgba(0,0,0,0.18);">${count}</div>`,
          className: "",
          iconSize: [48, 48]
        });
      }}
    >
      {children}
    </MarkerClusterGroup>
  );
}
