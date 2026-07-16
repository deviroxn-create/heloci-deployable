"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterLayer = ClusterLayer;
const jsx_runtime_1 = require("react/jsx-runtime");
const leaflet_1 = __importDefault(require("leaflet"));
const react_leaflet_cluster_1 = __importDefault(require("react-leaflet-cluster"));
const map_config_1 = require("@/lib/maps/map-config");
function ClusterLayer({ children }) {
    return ((0, jsx_runtime_1.jsx)(react_leaflet_cluster_1.default, { chunkedLoading: map_config_1.mapClusterOptions.chunkedLoading, maxClusterRadius: map_config_1.mapClusterOptions.maxClusterRadius, disableClusteringAtZoom: map_config_1.mapClusterOptions.disableClusteringAtZoom, spiderfyOnMaxZoom: map_config_1.mapClusterOptions.spiderfyOnMaxZoom, showCoverageOnHover: map_config_1.mapClusterOptions.showCoverageOnHover, iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            return leaflet_1.default.divIcon({
                html: `<div style="width:48px;height:48px;border-radius:24px;background:${map_config_1.mapColors.primary};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;box-shadow:0 16px 30px rgba(0,0,0,0.18);">${count}</div>`,
                className: "",
                iconSize: [48, 48]
            });
        }, children: children }));
}
