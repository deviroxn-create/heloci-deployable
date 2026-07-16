"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = geocodeAddress;
exports.reverseGeocode = reverseGeocode;
async function geocodeAddress(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
            headers: {
                "Accept-Language": "en"
            }
        });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        const result = data?.[0];
        if (!result) {
            return null;
        }
        return {
            latitude: Number(result.lat),
            longitude: Number(result.lon),
            displayName: result.display_name
        };
    }
    catch {
        return null;
    }
}
async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
                "Accept-Language": "en"
            }
        });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return {
            displayName: data.display_name,
            address: data.address
        };
    }
    catch {
        return null;
    }
}
