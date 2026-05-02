import Link from "next/link";
import { Search, MapPin, Stethoscope, Building2, Star, ArrowRight, Shield } from "lucide-react";
import {
  searchClinics,
  searchClinicsNearby,
  listClinicSpecialties,
  type ClinicSearchResult,
} from "@/lib/data/clinics";
import { PatientNav } from "@/components/public/PatientNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { NearMeButton } from "@/components/public/NearMeButton";
import { ClinicMapView } from "@/components/public/ClinicMapView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a clinic — Clinica",
  description:
    "Search verified clinics across Algeria. Filter by city and specialty, book in seconds.",
};

const POPULAR_CHIPS = [
  "Cardiology",
  "Pediatrics",
  "Dentistry",
  "Dermatology",
  "General Practice",
];
const ACCENT_POOL = [
  "#2563EB",
  "#DC2626",
  "#D97706",
  "#059669",
  "#0F766E",
  "#4F46E5",
];

/**
 * Patient discovery page — mirrors `.design-handoff/pages/patient.jsx → SearchPage`.
 *
 *   PatientNav
 *   Hero (h1 + subline) + single pill search bar (search / city / specialty + button)
 *   Popular chips
 *   Result count + view toggle (grid)
 *   3-col responsive grid of ClinicCard
 *   Footer
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    specialty?: string;
    q?: string;
    lat?: string;
    lon?: string;
    radiusKm?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const city = params.city?.trim() ?? "";
  const specialty = params.specialty?.trim() ?? "";
  const q = params.q?.trim() ?? "";
  const latitude = Number(params.lat);
  const longitude = Number(params.lon);
  const hasUserCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const radiusKm = Number(params.radiusKm);
  const viewMode = params.view === "map" ? "map" : "list";
  const listParams = new URLSearchParams();
  const mapParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (key === "view") continue;
    listParams.set(key, value);
    mapParams.set(key, value);
  }
  mapParams.set("view", "map");
  const listHref = `/search${listParams.size > 0 ? `?${listParams.toString()}` : ""}`;
  const mapHref = `/search?${mapParams.toString()}`;

  const [clinics, specialties] = await Promise.all([
    hasUserCoords
      ? searchClinicsNearby({
          latitude,
          longitude,
          radiusKm: Number.isFinite(radiusKm) ? radiusKm : 10,
          city,
          specialty,
          query: q,
        })
      : searchClinics({ city, specialty, query: q }),
    listClinicSpecialties(),
  ]);

  return (
    <div data-screen-label="Search" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PatientNav />

      {/* Hero + filter bar */}
      <div
        style={{
          background: "var(--surface-bright)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div className="resp-page-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 24px" }}>
          <h1 className="t-h2 resp-h2" style={{ margin: 0 }}>
            Find a clinic near you.
          </h1>
          <p className="t-body" style={{ marginTop: 8 }}>
            Book in seconds. Search verified clinics across Algeria.
          </p>

          <form
            method="get"
            action="/search"
            className="card resp-search-bar"
            style={{
              marginTop: 24,
              padding: 8,
              display: "flex",
              gap: 6,
              alignItems: "center",
              boxShadow: "var(--elev-2)",
            }}
          >
            <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <Search size={18} style={{ color: "var(--text-subtle)" }} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Clinic name, doctor, or condition"
                style={{
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  width: "100%",
                  fontSize: 14,
                  color: "var(--on-surface)",
                }}
              />
            </div>
            <div style={{ width: 1, height: 24, background: "var(--outline-variant)" }} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <MapPin size={16} style={{ color: "var(--text-subtle)" }} />
              <input
                name="city"
                defaultValue={city}
                placeholder="All cities"
                list="cities-list"
                style={{
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  width: "100%",
                  fontSize: 14,
                  color: "var(--on-surface)",
                }}
              />
              <datalist id="cities-list">
                {["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Setif"].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--outline-variant)" }} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <Stethoscope size={16} style={{ color: "var(--text-subtle)" }} />
              <select
                name="specialty"
                defaultValue={specialty}
                style={{
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  width: "100%",
                  fontSize: 14,
                  cursor: "pointer",
                  color: "var(--on-surface)",
                }}
              >
                <option value="">All specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn primary">
              Search
            </button>
          </form>

          {/* Popular chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span className="t-small" style={{ marginRight: 8 }}>
              Popular:
            </span>
            {POPULAR_CHIPS.map((s) => {
              const active = specialty === s;
              const params = new URLSearchParams();
              if (city) params.set("city", city);
              if (q) params.set("q", q);
              if (!active) params.set("specialty", s);
              const href = `/search${params.toString() ? `?${params.toString()}` : ""}`;
              return (
                <Link
                  key={s}
                  href={href}
                  className="chip"
                  style={{
                    cursor: "pointer",
                    background: active ? "var(--primary-50)" : "var(--surface-bright)",
                    color: active ? "var(--primary-600)" : "var(--text-muted)",
                    borderColor: active ? "var(--primary-100)" : "var(--outline-variant)",
                    textDecoration: "none",
                  }}
                >
                  {s}
                </Link>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <NearMeButton />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="resp-page-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px 80px", flex: 1, width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>
              {clinics.length} {clinics.length === 1 ? "clinic" : "clinics"}
            </span>{" "}
            found
            {city ? ` in ${city}` : ""}
            {specialty ? ` · ${specialty}` : ""}
            {hasUserCoords ? " · sorted by distance" : ""}
          </div>
        </div>

        {clinics.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Link
                href={listHref}
                className="chip"
                style={{
                  textDecoration: "none",
                  background: viewMode === "list" ? "var(--primary-50)" : "var(--surface-bright)",
                  color: viewMode === "list" ? "var(--primary-600)" : "var(--text-muted)",
                  borderColor: viewMode === "list" ? "var(--primary-100)" : "var(--outline-variant)",
                }}
              >
                List + Map
              </Link>
              <Link
                href={mapHref}
                className="chip"
                style={{
                  textDecoration: "none",
                  background: viewMode === "map" ? "var(--primary-50)" : "var(--surface-bright)",
                  color: viewMode === "map" ? "var(--primary-600)" : "var(--text-muted)",
                  borderColor: viewMode === "map" ? "var(--primary-100)" : "var(--outline-variant)",
                }}
              >
                Map only
              </Link>
            </div>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: viewMode === "map" ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
              {viewMode === "list" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 16,
                    alignSelf: "start",
                  }}
                >
                  {clinics.map((c, i) => (
                    <ClinicCard
                      key={c.id}
                      clinic={c}
                      accent={ACCENT_POOL[i % ACCENT_POOL.length]}
                    />
                  ))}
                </div>
              ) : null}
              <div style={{ position: "sticky", top: 84, alignSelf: "start" }}>
                <ClinicMapView
                  clinics={clinics}
                  focusLat={hasUserCoords ? latitude : undefined}
                  focusLon={hasUserCoords ? longitude : undefined}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}

function ClinicCard({ clinic, accent }: { clinic: ClinicSearchResult; accent: string }) {
  // Status='approved' means the public listing — design shows that as "Verified".
  const verified = clinic.status === "approved";
  const description =
    clinic.description ?? `Learn more about ${clinic.name} and book online.`;

  return (
    <Link
      href={`/clinic/${clinic.id}`}
      className="card"
      style={{
        padding: 0,
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform .12s ease, box-shadow .12s ease",
      }}
    >
      {/* Hero photo placeholder */}
      <div
        style={{
          width: "100%",
          height: 160,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Building2 size={48} style={{ color: accent, opacity: 0.5 }} />
        {verified ? (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(4px)",
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--primary-600)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Shield size={11} strokeWidth={2.2} /> Verified
          </div>
        ) : null}
      </div>

      <div
        style={{
          padding: 18,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--on-surface)" }}>
              {clinic.name}
            </div>
            {clinic.specialty ? (
              <div style={{ fontSize: 12, color: "var(--primary-600)", fontWeight: 500, marginTop: 2 }}>
                {clinic.specialty}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 12,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <Star size={13} style={{ color: "#F59E0B", fill: "#F59E0B" }} strokeWidth={0} />
            <b style={{ color: "var(--on-surface)" }}>4.8</b>
            <span>(—)</span>
          </div>
        </div>
        {clinic.city || clinic.address ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-subtle)",
            }}
          >
            <MapPin size={12} />
            {clinic.city}
            {clinic.address ? ` · ${clinic.address.split(",")[0]}` : ""}
          </div>
        ) : null}
        {clinic.distance_km != null ? (
          <div style={{ fontSize: 12, color: "var(--primary-600)", fontWeight: 600 }}>
            {clinic.distance_km.toFixed(1)} km away
          </div>
        ) : null}
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            margin: "8px 0 0",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: "auto",
            paddingTop: 10,
          }}
        >
          <span className="chip success dot">Available today</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 13,
              color: "var(--primary-600)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Book <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card" style={{ padding: 60, textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 16px",
          background: "var(--bg-muted)",
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          color: "var(--text-subtle)",
        }}
      >
        <Search size={28} />
      </div>
      <h3 className="t-h4" style={{ margin: 0 }}>
        No clinics match your filters.
      </h3>
      <p className="t-body" style={{ maxWidth: 360, margin: "8px auto 0" }}>
        Try widening your specialty, changing city, or clearing the search box.
      </p>
      <Link
        href="/search"
        className="btn secondary"
        style={{ marginTop: 16, display: "inline-flex" }}
      >
        Clear filters
      </Link>
    </div>
  );
}
