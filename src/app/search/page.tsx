import Link from "next/link";
import { MapPin, Stethoscope, ChevronDown, Search, Building2 } from "lucide-react";
import {
  searchClinics,
  listClinicSpecialties,
  type Clinic,
} from "@/lib/data/clinics";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a clinic — Clinica",
  description:
    "Search top-rated medical professionals in your area. Filter by city and specialty, and book in three taps.",
};

/**
 * Public clinic directory — Clinica handoff design.
 *
 * Two-pane layout: filter rail with the iconified inputs at the top,
 * then a 1/2/3-column responsive grid of mobile-style clinic cards
 * below. Cards mirror the handoff's `PAClinicCard` so the card you
 * see on the web matches the card you see in the patient mobile flow.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; specialty?: string; q?: string }>;
}) {
  const params = await searchParams;
  const city = params.city?.trim() ?? "";
  const specialty = params.specialty?.trim() ?? "";
  const q = params.q?.trim() ?? "";

  const [clinics, specialties] = await Promise.all([
    searchClinics({ city, specialty, query: q }),
    listClinicSpecialties(),
  ]);

  const hasFilters = Boolean(city || specialty || q);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* Hero + filters */}
        <section
          style={{
            background: "var(--surface-bright)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "32px 32px 24px",
            }}
          >
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Find a clinic
            </h1>
            <p
              className="t-body"
              style={{ margin: "6px 0 22px", maxWidth: 540 }}
            >
              Search by city and specialty. Real-time availability, no phone
              calls needed.
            </p>

            <form
              method="get"
              action="/search"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 8,
              }}
            >
              <label style={{ position: "relative" }}>
                <MapPin
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 14,
                    color: "var(--text-subtle)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  name="city"
                  defaultValue={city}
                  placeholder="City (e.g. Algiers)"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    borderRadius: 12,
                    border: "1px solid var(--outline-variant)",
                    background: "var(--bg-muted)",
                    fontSize: 14,
                    fontWeight: 500,
                    outline: "none",
                  }}
                />
              </label>
              <label style={{ position: "relative" }}>
                <Stethoscope
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 14,
                    color: "var(--text-subtle)",
                    pointerEvents: "none",
                  }}
                />
                <select
                  name="specialty"
                  defaultValue={specialty}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    borderRadius: 12,
                    border: "1px solid var(--outline-variant)",
                    background: "var(--bg-muted)",
                    fontSize: 14,
                    fontWeight: 500,
                    appearance: "none",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All specialties</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 15,
                    color: "var(--text-subtle)",
                    pointerEvents: "none",
                  }}
                />
              </label>
              <label style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 14,
                    color: "var(--text-subtle)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name…"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 38px",
                    borderRadius: 12,
                    border: "1px solid var(--outline-variant)",
                    background: "var(--bg-muted)",
                    fontSize: 14,
                    fontWeight: 500,
                    outline: "none",
                  }}
                />
              </label>
              <button type="submit" className="btn primary" style={{ padding: "0 22px" }}>
                <Search size={15} />
                Search
              </button>
            </form>

            {hasFilters && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                }}
              >
                <p className="t-small">
                  <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>
                    {clinics.length} {clinics.length === 1 ? "clinic" : "clinics"}
                  </span>
                  {city ? ` in ${city}` : ""}
                  {specialty ? ` · ${specialty}` : ""}
                </p>
                <Link
                  href="/search"
                  style={{
                    fontSize: 12,
                    color: "var(--primary-600)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Clear filters
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "28px 32px 64px",
          }}
        >
          {clinics.length === 0 ? (
            <EmptyResults hasFilters={hasFilters} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14,
              }}
            >
              {clinics.map((c) => (
                <ClinicCard key={c.id} clinic={c} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const accent = "#2563EB";
  const description =
    clinic.description ??
    `Learn more about ${clinic.name} and book online.`;

  return (
    <Link
      href={`/clinic/${clinic.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "var(--surface-bright)",
        borderRadius: 16,
        padding: 16,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -6px rgba(15,23,42,0.06)",
        border: "1px solid rgba(15,23,42,0.04)",
        transition: "transform .12s ease, box-shadow .12s ease",
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
            color: accent,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.3,
              color: "var(--on-surface)",
            }}
          >
            {clinic.name}
          </div>
          {clinic.specialty ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--primary-600)",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              {clinic.specialty}
            </div>
          ) : null}
          {clinic.city ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--text-subtle)",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MapPin size={10} /> {clinic.city}
            </div>
          ) : null}
        </div>
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.5,
          margin: "0 0 12px",
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
          width: "100%",
          padding: "10px 0",
          borderRadius: 10,
          border: 0,
          background: "var(--primary)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        View Clinic
      </div>
    </Link>
  );
}

function EmptyResults({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "var(--bg-muted)",
          color: "var(--text-subtle)",
          display: "grid",
          placeItems: "center",
          marginBottom: 18,
        }}
      >
        <Search size={32} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
        {hasFilters ? "No clinics found" : "No clinics yet"}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          lineHeight: 1.5,
          maxWidth: 320,
        }}
      >
        {hasFilters
          ? "Try a different city or specialty to widen your search."
          : "Once clinics join the network they'll appear here."}
      </div>
      {hasFilters ? (
        <Link
          href="/search"
          className="btn secondary"
          style={{ marginTop: 20 }}
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
