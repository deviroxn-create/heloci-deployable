import L from "leaflet";
import { mapColors } from "@/lib/maps/map-config";

export type MarkerStatus = "default" | "selected" | "available" | "occupied" | "waitlist" | "disabled";

const statusColorMap: Record<MarkerStatus, string> = {
  default: mapColors.primary,
  selected: mapColors.selected,
  available: mapColors.available,
  occupied: mapColors.occupied,
  waitlist: mapColors.waitlist,
  disabled: "#94A3B8"
};

export function createMapMarkerIcon(status: MarkerStatus = "default", selected = false) {
  const color = statusColorMap[status] ?? mapColors.primary;
  const size = selected ? 48 : 38;
  const innerSize = selected ? 22 : 16;

  return L.divIcon({
    html: `
      <div style="position: relative; width: ${size}px; height: ${size + 10}px; display: flex; align-items: flex-end; justify-content: center;">
        <div style="width: ${innerSize}px; height: ${innerSize}px; border-radius: 50%; background: ${color}; border: 2px solid rgba(255,255,255,0.95); box-shadow: 0 14px 28px rgba(15,23,42,0.24); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700;">
          ${selected ? "★" : ""}
        </div>
        <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%) rotate(45deg); width: 14px; height: 14px; background: ${color};"></div>
      </div>
    `,
    className: "",
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10]
  });
}
