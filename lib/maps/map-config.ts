export const defaultMapCenter: [number, number] = [37.7749, -122.4194];
export const defaultMapZoom = 11;

export const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const mapColors = {
  primary: "#003DB8",
  selected: "#002E8A",
  available: "#22C55E",
  occupied: "#EF4444",
  waitlist: "#F59E0B",
  transit: "#6366F1",
  service: "#10B981"
};

export const mapClusterOptions = {
  chunkedLoading: true,
  maxClusterRadius: 48,
  disableClusteringAtZoom: 14,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: true
};
