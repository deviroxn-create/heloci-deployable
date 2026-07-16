"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.formatDistance = formatDistance;
exports.formatDuration = formatDuration;
exports.getRoutePreview = getRoutePreview;
function haversineDistance(start, end) {
    const toRadians = (value) => (value * Math.PI) / 180;
    const [lat1, lon1] = start;
    const [lat2, lon2] = end;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const earthRadius = 6371000;
    return earthRadius * c;
}
function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}
function formatDuration(seconds) {
    if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    return `${Math.round(seconds / 60)} min`;
}
async function getRoutePreview(origin, destination) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route) {
            return null;
        }
        return {
            distance: route.distance,
            duration: route.duration,
            coordinates: (route.geometry?.coordinates).map(([lng, lat]) => [lat, lng])
        };
    }
    catch {
        return null;
    }
}
