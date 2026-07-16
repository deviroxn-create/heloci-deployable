"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyPlaces = getNearbyPlaces;
exports.getNearbySchools = getNearbySchools;
exports.getNearbyHospitals = getNearbyHospitals;
exports.getNearbyTransit = getNearbyTransit;
exports.getNearbyGroceries = getNearbyGroceries;
exports.getNearbyPharmacies = getNearbyPharmacies;
const distance_1 = require("./distance");
const placeQueries = {
    schools: `node(around:RADIUS,LAT,LNG)["amenity"="school"];way(around:RADIUS,LAT,LNG)["amenity"="school"];rel(around:RADIUS,LAT,LNG)["amenity"="school"];`,
    hospitals: `node(around:RADIUS,LAT,LNG)["amenity"="hospital"];way(around:RADIUS,LAT,LNG)["amenity"="hospital"];rel(around:RADIUS,LAT,LNG)["amenity"="hospital"];`,
    transit: `node(around:RADIUS,LAT,LNG)["highway"="bus_stop"];node(around:RADIUS,LAT,LNG)["public_transport"="platform"];node(around:RADIUS,LAT,LNG)["railway"="station"];`,
    groceries: `node(around:RADIUS,LAT,LNG)["shop"="supermarket"];node(around:RADIUS,LAT,LNG)["shop"="grocery"];node(around:RADIUS,LAT,LNG)["shop"="convenience"];`,
    pharmacies: `node(around:RADIUS,LAT,LNG)["amenity"="pharmacy"];`
};
const cache = new Map();
function buildQuery(latitude, longitude, radius, category) {
    const template = placeQueries[category];
    if (!template) {
        throw new Error(`Unsupported nearby place category: ${category}`);
    }
    return `[
    out:json
  ];
  (
    ${template.replace(/LAT/g, String(latitude)).replace(/LNG/g, String(longitude)).replace(/RADIUS/g, String(radius))}
  );
  out center;`;
}
function normalizePlace(element, category, latitude, longitude) {
    const lat = element.lat ?? element.center?.lat ?? element.bounds?.minlat;
    const lon = element.lon ?? element.center?.lon ?? element.bounds?.minlon;
    if (typeof lat !== "number" || typeof lon !== "number") {
        return null;
    }
    const name = element.tags?.name || `${category.charAt(0).toUpperCase() + category.slice(1)} service`;
    const distanceMeters = (0, distance_1.haversineDistance)([latitude, longitude], [lat, lon]);
    return {
        id: `${category}-${element.id}`,
        name,
        category,
        latitude: lat,
        longitude: lon,
        distanceMeters,
        address: element.tags?.["addr:street"] ? `${element.tags["addr:street"]}${element.tags["addr:housenumber"] ? ` ${element.tags["addr:housenumber"]}` : ""}` : undefined
    };
}
async function getNearbyPlaces(latitude, longitude, category, radius = 2500) {
    const cacheKey = `${latitude.toFixed(4)}:${longitude.toFixed(4)}:${category}:${radius}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    const overpassQuery = buildQuery(latitude, longitude, radius, category);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: overpassQuery
    });
    if (!response.ok) {
        throw new Error("Failed to fetch nearby place data");
    }
    const data = await response.json();
    const places = data.elements
        .map((element) => normalizePlace(element, category, latitude, longitude))
        .filter((place) => place !== null)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, 12);
    cache.set(cacheKey, places);
    return places;
}
function getNearbySchools(latitude, longitude) {
    return getNearbyPlaces(latitude, longitude, "schools");
}
function getNearbyHospitals(latitude, longitude) {
    return getNearbyPlaces(latitude, longitude, "hospitals");
}
function getNearbyTransit(latitude, longitude) {
    return getNearbyPlaces(latitude, longitude, "transit");
}
function getNearbyGroceries(latitude, longitude) {
    return getNearbyPlaces(latitude, longitude, "groceries");
}
function getNearbyPharmacies(latitude, longitude) {
    return getNearbyPlaces(latitude, longitude, "pharmacies");
}
