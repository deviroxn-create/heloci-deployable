export interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
}

export interface PropertyUnit {
  id: string;
  beds: number;
  price: number;
  available: boolean;
}

export interface PropertyLocation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string;
  rent: number;
  status: string;
}

export interface Property {
  id: string;
  externalId?: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rent: number;          // lowest price
  rentMax?: number | null; // highest price (for range)
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  specialOffers: string[];
  contactPhone?: string | null;
  availabilityCount: number;
  status: string;
  units: PropertyUnit[];
  images: PropertyImage[];
}
