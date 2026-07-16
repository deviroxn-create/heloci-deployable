"use client";

import { useEffect, useState } from "react";
import { getNearbySchools, getNearbyHospitals, getNearbyTransit, getNearbyGroceries, getNearbyPharmacies } from "@/lib/maps/places";
import type { NearbyPlace } from "@/lib/maps/places";

export interface NearbyServicesState {
  schools: NearbyPlace[];
  hospitals: NearbyPlace[];
  transit: NearbyPlace[];
  groceries: NearbyPlace[];
  pharmacies: NearbyPlace[];
}

const initialServices: NearbyServicesState = {
  schools: [],
  hospitals: [],
  transit: [],
  groceries: [],
  pharmacies: []
};

export function useNearbyPlaces(latitude: number, longitude: number, enabled = true) {
  const [services, setServices] = useState<NearbyServicesState>(initialServices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!enabled || !latitude || !longitude) {
      setServices(initialServices);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getNearbySchools(latitude, longitude),
      getNearbyHospitals(latitude, longitude),
      getNearbyTransit(latitude, longitude),
      getNearbyGroceries(latitude, longitude),
      getNearbyPharmacies(latitude, longitude)
    ])
      .then(([schools, hospitals, transit, groceries, pharmacies]) => {
        if (!mounted) return;
        setServices({ schools, hospitals, transit, groceries, pharmacies });
      })
      .catch(() => {
        if (!mounted) return;
        setError("Unable to load nearby services at this time.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled, latitude, longitude]);

  return { services, loading, error };
}
