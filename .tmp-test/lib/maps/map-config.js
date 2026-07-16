"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapClusterOptions = exports.mapColors = exports.tileLayerAttribution = exports.tileLayerUrl = exports.defaultMapZoom = exports.defaultMapCenter = void 0;
exports.defaultMapCenter = [37.7749, -122.4194];
exports.defaultMapZoom = 11;
exports.tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
exports.tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
exports.mapColors = {
    primary: "#003DB8",
    selected: "#002E8A",
    available: "#22C55E",
    occupied: "#EF4444",
    waitlist: "#F59E0B",
    transit: "#6366F1",
    service: "#10B981"
};
exports.mapClusterOptions = {
    chunkedLoading: true,
    maxClusterRadius: 48,
    disableClusteringAtZoom: 14,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true
};
