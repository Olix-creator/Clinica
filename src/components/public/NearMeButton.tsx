"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, LocateFixed } from "lucide-react";

export function NearMeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const usingLocation = Boolean(params.get("lat") && params.get("lon"));

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function useLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    startTransition(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(4));
          const lon = Number(position.coords.longitude.toFixed(4));
          updateParams({
            lat: String(lat),
            lon: String(lon),
            radiusKm: params.get("radiusKm") ?? "10",
          });
        },
        () => {
          setError("Location access is off. Enter city or choose from popular cities.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    });
  }

  function clearLocation() {
    setError("");
    updateParams({ lat: null, lon: null, radiusKm: null });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {usingLocation ? (
          <>
            <span className="chip success">Using your location</span>
            <button type="button" className="btn ghost sm" onClick={clearLocation}>
              Clear
            </button>
          </>
        ) : (
          <button type="button" className="btn secondary sm" onClick={useLocation} disabled={pending}>
            {pending ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            Find clinics near me
          </button>
        )}
      </div>
      {error ? (
        <div className="t-small" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
