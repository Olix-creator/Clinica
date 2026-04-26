import { getGeocodeProvider } from "@/lib/maps/provider";

export type GeocodedClinicLocation = {
  latitude: number;
  longitude: number;
  locationSource: "address_geocode";
  locationAccuracyM: number | null;
  lastGeocodedAt: string;
};

const geocodeCache = new Map<string, GeocodedClinicLocation>();

export async function geocodeClinicAddress(
  address: string,
  city?: string,
): Promise<GeocodedClinicLocation | null> {
  const cleanAddress = address.trim();
  const cleanCity = city?.trim() || undefined;
  if (!cleanAddress) return null;
  const cacheKey = `${cleanAddress.toLowerCase()}|${(cleanCity ?? "").toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  const provider = getGeocodeProvider();
  if (!provider) return null;

  try {
    const result = await provider.geocodeAddress(cleanAddress, cleanCity);
    if (!result) return null;
    const payload: GeocodedClinicLocation = {
      latitude: result.latitude,
      longitude: result.longitude,
      locationSource: "address_geocode",
      locationAccuracyM: result.accuracyMeters,
      lastGeocodedAt: new Date().toISOString(),
    };
    geocodeCache.set(cacheKey, payload);
    return payload;
  } catch (error) {
    console.error("[clinica] geocodeClinicAddress:", error);
    return null;
  }
}
