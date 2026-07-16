"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNearbyPlaces = useNearbyPlaces;
const react_1 = require("react");
const places_1 = require("@/lib/maps/places");
const initialServices = {
    schools: [],
    hospitals: [],
    transit: [],
    groceries: [],
    pharmacies: []
};
function useNearbyPlaces(latitude, longitude, enabled = true) {
    const [services, setServices] = (0, react_1.useState)(initialServices);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        if (!enabled || !latitude || !longitude) {
            setServices(initialServices);
            return;
        }
        setLoading(true);
        setError(null);
        Promise.all([
            (0, places_1.getNearbySchools)(latitude, longitude),
            (0, places_1.getNearbyHospitals)(latitude, longitude),
            (0, places_1.getNearbyTransit)(latitude, longitude),
            (0, places_1.getNearbyGroceries)(latitude, longitude),
            (0, places_1.getNearbyPharmacies)(latitude, longitude)
        ])
            .then(([schools, hospitals, transit, groceries, pharmacies]) => {
            if (!mounted)
                return;
            setServices({ schools, hospitals, transit, groceries, pharmacies });
        })
            .catch(() => {
            if (!mounted)
                return;
            setError("Unable to load nearby services at this time.");
        })
            .finally(() => {
            if (!mounted)
                return;
            setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, [enabled, latitude, longitude]);
    return { services, loading, error };
}
