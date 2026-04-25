import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clock,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { getClinicById, listPublicDoctorsByClinic } from "@/lib/data/clinics";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ClinicBookingCta } from "@/components/public/ClinicBookingCta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) return { title: "Clinic — Clinica" };
  return {
    title: `${clinic.name} — Clinica`,
    description:
      clinic.description ??
      `Learn about ${clinic.name} and book an appointment online.`,
  };
}

/**
 * Public clinic detail page — recreated from the handoff's
 * `PAClinicDetail` (mobile patient flow) but laid out as a desktop
 * page: hero panel on top, info + bio + doctors on the left, sticky
 * booking CTA on the right.
 */
export default async function ClinicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) notFound();

  const [doctors, supabase] = await Promise.all([
    listPublicDoctorsByClinic(id),
    createClient(),
  ]);
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = Boolean(userData.user);

  // Hard-coded design tokens that mirror the handoff's mock CLINICS data.
  // Until we attach real ratings + hours these are presentational only.
  const accent = "#2563EB";
  const rating = 4.8;
  const reviews = 312;
  const hours = "Mon–Sat · 8:00 – 19:00";

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />

      <main
        style={{
          flex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          padding: "20px 32px 48px",
        }}
      >
        <Link
          href="/search"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Back to results
        </Link>

        {/* Hero card */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              height: 160,
              background: `linear-gradient(135deg, ${accent}30, ${accent}08)`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "#fff",
                color: accent,
                display: "grid",
                placeItems: "center",
                boxShadow: "var(--elev-1)",
              }}
            >
              <Building2 size={32} />
            </div>
          </div>

          <div style={{ padding: "20px 28px 28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                flexWrap: "wrap",
              }}
            >
              {clinic.specialty ? (
                <span className="chip primary" style={{ fontSize: 11 }}>
                  {clinic.specialty}
                </span>
              ) : null}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                <Star
                  size={12}
                  style={{ color: "#F59E0B", fill: "#F59E0B" }}
                  strokeWidth={0}
                />
                <b style={{ color: "var(--on-surface)" }}>{rating}</b> ·{" "}
                {reviews} reviews
              </span>
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {clinic.name}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 18,
                marginTop: 14,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {clinic.address ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  {clinic.address}
                </div>
              ) : null}
              {clinic.phone ? (
                <a
                  href={`tel:${clinic.phone}`}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <Phone size={14} />
                  {clinic.phone}
                </a>
              ) : null}
              <div
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <Clock size={14} />
                {hours}
              </div>
            </div>
            {clinic.description ? (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  marginTop: 18,
                  marginBottom: 0,
                  maxWidth: 720,
                }}
              >
                {clinic.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Doctors + booking */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: 24,
            alignItems: "flex-start",
          }}
          className="lg-grid"
        >
          {/* Doctors list */}
          <div className="card" style={{ padding: 24 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Doctors
            </h2>
            <p className="t-small" style={{ marginBottom: 14 }}>
              {doctors.length > 0
                ? `${doctors.length} ${doctors.length === 1 ? "specialist" : "specialists"} available at this clinic.`
                : "No doctors have joined this clinic yet."}
            </p>
            {doctors.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {doctors.map((d) => {
                  const init = (d.name ?? "Doctor")
                    .split(" ")
                    .filter((p) => p && !p.startsWith("Dr"))
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        background: "var(--surface-bright)",
                        borderRadius: 12,
                        border: "1px solid var(--outline-variant)",
                      }}
                    >
                      <span
                        className="avatar"
                        style={{
                          width: 40,
                          height: 40,
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          fontSize: 13,
                        }}
                      >
                        {init || "DR"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {d.name ?? "Doctor"}
                        </div>
                        {d.specialty ? (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-subtle)",
                            }}
                          >
                            {d.specialty}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Booking CTA */}
          <div style={{ position: "sticky", top: 88 }}>
            <ClinicBookingCta
              clinicId={clinic.id}
              doctors={doctors}
              isSignedIn={isSignedIn}
            />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
