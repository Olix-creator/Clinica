type GeocodeResult = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  provider: "mapbox";
};

type GeocodeProvider = {
  geocodeAddress(address: string, city?: string): Promise<GeocodeResult | null>;
};

class MapboxGeocodeProvider implements GeocodeProvider {
  constructor(private readonly token: string) {}

  async geocodeAddress(address: string, city?: string): Promise<GeocodeResult | null> {
    const query = [address, city].filter(Boolean).join(", ").trim();
    if (!query) return null;
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", this.token);
    url.searchParams.set("limit", "1");
    url.searchParams.set("types", "address,poi,place");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ center?: [number, number]; relevance?: number }>;
    };
    const feature = data.features?.[0];
    const center = feature?.center;
    if (!center || center.length !== 2) return null;

    return {
      longitude: center[0],
      latitude: center[1],
      // Mapbox response doesn't provide precise meters directly in this endpoint.
      accuracyMeters: feature?.relevance ? Math.round((1 - feature.relevance) * 1000) : null,
      provider: "mapbox",
    };
  }
}

export function getGeocodeProvider(): GeocodeProvider | null {
  const token = process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  return new MapboxGeocodeProvider(token);
}

export type { GeocodeResult, GeocodeProvider };
