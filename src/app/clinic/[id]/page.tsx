import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Phone,
  Clock,
  Star,
  Heart,
  Shield,
} from "lucide-react";
import { getClinicById, listPublicDoctorsByClinic } from "@/lib/data/clinics";
import { createClient } from "@/lib/supabase/server";
import { PatientNav } from "@/components/public/PatientNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ClinicLocationMap } from "@/components/public/ClinicLocationMap";
import { ClinicBookingPanel } from "@/components/public/ClinicBookingPanel";
import {
  bookAppointment,
  loadBookedSlots,
  findNextAvailable,
} from "./booking-actions";

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

const ACCENT = "#2563EB";

function avatarInitials(name: string | null | undefined): string {
  if (!name) return "DR";
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Public clinic detail — mirrors `.design-handoff/pages/patient.jsx → ClinicDetailPage`.
 *
 *   PatientNav
 *   Tinted hero band: breadcrumb · chip row · h1 · meta line · Save / Book actions
 *   Two-column body: About + Doctors + Map  ·  sticky right rail (Next available + Contact)
 *   PublicFooter
 */
export default async function ClinicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doctor?: string; date?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const clinic = await getClinicById(id);
  if (!clinic) notFound();

  const [doctors, supabase] = await Promise.all([
    listPublicDoctorsByClinic(id),
    createClient(),
  ]);
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = Boolean(userData.user);

  const verified = clinic.status === "approved";

  // Pull the patient's saved phone (if signed in) so the inline booking
  // form can pre-fill it.
  let initialPhone = "";
  if (isSignedIn && userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userData.user.id)
      .maybeSingle();
    initialPhone = profile?.phone ?? "";
  }

  // Anchor link the hero "Book appointment" CTA jumps to so users on
  // long pages don't lose their place.
  const bookAnchor = "#book";

  return (
    <div data-screen-label="Clinic detail" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PatientNav />

      {/* Hero header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}04 100%)`,
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--text-subtle)",
              marginBottom: 20,
            }}
          >
            <Link href="/search" style={{ color: "inherit", textDecoration: "none" }}>
              Search
            </Link>
            <ChevronRight size={12} />
            <span>{clinic.city ?? "—"}</span>
            <ChevronRight size={12} />
            <span style={{ color: "var(--on-surface)" }}>{clinic.name}</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 40,
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {clinic.specialty ? (
                  <span
                    className="chip"
                    style={{
                      background: `${ACCENT}14`,
                      color: ACCENT,
                      border: `1px solid ${ACCENT}30`,
                    }}
                  >
                    {clinic.specialty}
                  </span>
                ) : null}
                {verified ? (
                  <span className="chip primary">
                    <Shield size={11} strokeWidth={2.2} /> Verified
                  </span>
                ) : null}
              </div>
              <h1 className="t-h1" style={{ margin: 0, fontSize: 42 }}>
                {clinic.name}
              </h1>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  marginTop: 16,
                  color: "var(--text-muted)",
                  fontSize: 14,
                  flexWrap: "wrap",
                }}
              >
                {clinic.address ? (
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <MapPin size={15} />
                    {clinic.address}
                  </span>
                ) : null}
                {clinic.phone ? (
                  <a
                    href={`tel:${clinic.phone}`}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <Phone size={15} />
                    {clinic.phone}
                  </a>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  marginTop: 12,
                  color: "var(--text-muted)",
                  fontSize: 14,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <Star
                    size={15}
                    style={{ color: "#F59E0B", fill: "#F59E0B" }}
                    strokeWidth={0}
                  />
                  <b style={{ color: "var(--on-surface)" }}>4.8</b>
                  <span style={{ color: "var(--text-subtle)" }}>(312 reviews)</span>
                </span>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Clock size={14} />
                  Mon–Sat · 8:00 – 19:00
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn secondary" disabled>
                <Heart size={15} /> Save
              </button>
              <a href={bookAnchor} className="btn primary lg">
                Book appointment
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 32px 80px",
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 40,
          width: "100%",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <section>
            <h2 className="t-h3" style={{ marginBottom: 12 }}>
              About
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.65 }}>
              {clinic.description ??
                `Learn more about ${clinic.name} and book an appointment online.`}
            </p>
          </section>

          <section>
            <h2 className="t-h3" style={{ marginBottom: 16 }}>
              Doctors ({doctors.length})
            </h2>
            {doctors.length === 0 ? (
              <div className="card" style={{ padding: 22, fontSize: 14, color: "var(--text-muted)" }}>
                No doctors have joined this clinic yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {doctors.map((d) => {
                  // Doctor card "Book" anchor pre-fills the inline panel via
                  // `?doctor=…` so the user lands ready-to-pick-time.
                  const docHref = `?doctor=${d.id}#book`;
                  return (
                    <div
                      key={d.id}
                      className="card"
                      style={{
                        padding: 18,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <span
                        className="avatar"
                        style={{
                          width: 48,
                          height: 48,
                          background: "var(--primary-50)",
                          color: "var(--primary-600)",
                          fontSize: 14,
                        }}
                      >
                        {avatarInitials(d.name)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {d.name ?? "Doctor"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          {d.specialty ?? clinic.specialty ?? "General Practice"}
                        </div>
                      </div>
                      <a href={docHref} className="btn secondary sm">
                        Book
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="t-h3" style={{ marginBottom: 16 }}>
              Location
            </h2>
            <ClinicLocationMap
              clinicId={clinic.id}
              clinicName={clinic.name}
              latitude={clinic.latitude}
              longitude={clinic.longitude}
              city={clinic.city}
              specialty={clinic.specialty}
            />
            <div style={{ marginTop: 10 }}>
              <a
                href={
                  clinic.latitude != null && clinic.longitude != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${clinic.name} ${clinic.city ?? ""}`.trim(),
                      )}`
                }
                target="_blank"
                rel="noreferrer"
                className="btn secondary sm"
              >
                Open directions
              </a>
            </div>
          </section>
        </div>

        {/* Sticky right rail */}
        <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
          <ClinicBookingPanel
            clinicId={clinic.id}
            clinicName={clinic.name}
            doctors={doctors.map((d) => ({
              id: d.id,
              name: d.name,
              specialty: d.specialty,
            }))}
            isSignedIn={isSignedIn}
            initialPhone={initialPhone}
            initialDoctorId={sp.doctor ?? ""}
            initialDateISO={sp.date}
            bookAppointment={bookAppointment}
            loadSlots={loadBookedSlots}
            findSuggestion={findNextAvailable}
          />
          <div className="card" style={{ padding: 20, marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Contact
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {clinic.phone ? (
                <a
                  href={`tel:${clinic.phone}`}
                  style={{
                    display: "flex",
                    gap: 10,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <Phone size={15} /> {clinic.phone}
                </a>
              ) : null}
              {clinic.address ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <MapPin size={15} /> {clinic.address}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 10 }}>
                <Clock size={15} /> Mon–Sat · 8:00 – 19:00
              </div>
            </div>
          </div>
        </aside>
      </div>

      <PublicFooter />
    </div>
  );
}
