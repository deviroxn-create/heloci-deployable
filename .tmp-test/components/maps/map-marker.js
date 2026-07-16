"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMapMarkerIcon = createMapMarkerIcon;
const leaflet_1 = __importDefault(require("leaflet"));
const map_config_1 = require("@/lib/maps/map-config");
const statusColorMap = {
    default: map_config_1.mapColors.primary,
    selected: map_config_1.mapColors.selected,
    available: map_config_1.mapColors.available,
    occupied: map_config_1.mapColors.occupied,
    waitlist: map_config_1.mapColors.waitlist,
    disabled: "#94A3B8"
};
function createMapMarkerIcon(status = "default", selected = false) {
    const color = statusColorMap[status] ?? map_config_1.mapColors.primary;
    const size = selected ? 48 : 38;
    const innerSize = selected ? 22 : 16;
    return leaflet_1.default.divIcon({
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
