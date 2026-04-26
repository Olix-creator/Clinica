"use client";

import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

type ClinicPin = {
  id: string;
  name: string;
  specialty: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number | null;
};

export function ClinicMapView({
  clinics,
  focusLat,
  focusLon,
  className,
}: {
  clinics: ClinicPin[];
  focusLat?: number;
  focusLon?: number;
  className?: string;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapClinics = clinics.filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));

  const center = useMemo(() => {
    if (Number.isFinite(focusLat) && Number.isFinite(focusLon)) {
      return { latitude: focusLat as number, longitude: focusLon as number, zoom: 11 };
    }
    if (mapClinics.length > 0) {
      return {
        latitude: mapClinics[0].latitude as number,
        longitude: mapClinics[0].longitude as number,
        zoom: 10,
      };
    }
    return { latitude: 36.7538, longitude: 3.0588, zoom: 5 };
  }, [focusLat, focusLon, mapClinics]);

  const selected = selectedId ? mapClinics.find((c) => c.id === selectedId) ?? null : null;

  if (!token) {
    return (
      <div className={className ?? ""} style={{ borderRadius: 12, border: "1px solid var(--outline-variant)", padding: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Map preview is unavailable. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable map rendering.
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? ""} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--outline-variant)" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={center}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: 420 }}
      >
        {mapClinics.map((clinic) => (
          <Marker
            key={clinic.id}
            latitude={clinic.latitude as number}
            longitude={clinic.longitude as number}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelectedId(clinic.id);
            }}
          >
            <button
              type="button"
              aria-label={clinic.name}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--primary)",
                cursor: "pointer",
              }}
            >
              <MapPin size={28} fill="currentColor" />
            </button>
          </Marker>
        ))}
        {selected ? (
          <Popup
            latitude={selected.latitude as number}
            longitude={selected.longitude as number}
            closeButton
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
          >
            <div style={{ minWidth: 170 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {selected.specialty ?? "General Practice"}
                {selected.city ? ` · ${selected.city}` : ""}
              </div>
              {selected.distance_km != null ? (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {selected.distance_km.toFixed(1)} km away
                </div>
              ) : null}
              <Link href={`/clinic/${selected.id}`} style={{ fontSize: 12, fontWeight: 600, marginTop: 8, display: "inline-block" }}>
                View clinic
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
