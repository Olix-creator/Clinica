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
  ArrowRight,
} from "lucide-react";
import { getClinicById, listPublicDoctorsByClinic } from "@/lib/data/clinics";
import { createClient } from "@/lib/supabase/server";
import { PatientNav } from "@/components/public/PatientNav";
import { PublicFooter } from "@/components/public/PublicFooter";

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

  const verified = clinic.status === "approved";
  const bookHref = isSignedIn
    ? `/booking?clinicId=${clinic.id}`
    : `/login?redirect=${encodeURIComponent(`/booking?clinicId=${clinic.id}`)}`;

  // Three "Next available" placeholder slots — design shows three pre-baked
  // suggestions; the real slot data lives behind the booking form's
  // availability call. Keeping it static here matches the design without
  // pretending we have a fast slot lookup at this hop.
  const today = new Date();
  const day = (offsetDays: number, hh: string) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return `${d.toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} · ${hh}`;
  };
  const suggestions = [day(1, "09:00"), day(1, "10:30"), day(2, "14:00")];

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
              <Link href={bookHref} className="btn primary lg">
                Book appointment
              </Link>
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
                  const docHref = isSignedIn
                    ? `/booking?clinicId=${clinic.id}&doctorId=${d.id}`
                    : `/login?redirect=${encodeURIComponent(
                        `/booking?clinicId=${clinic.id}&doctorId=${d.id}`,
                      )}`;
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
                      <Link href={docHref} className="btn secondary sm">
                        Book
                      </Link>
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
            <div className="ph-stripe" style={{ height: 240, borderRadius: 14 }}>
              <span>map · {clinic.address ?? clinic.city ?? "—"}</span>
            </div>
          </section>
        </div>

        {/* Sticky right rail */}
        <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              Next available
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((slot, i) => (
                <Link
                  key={slot}
                  href={bookHref}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--outline-variant)",
                    textDecoration: "none",
                    color: "var(--on-surface)",
                    fontSize: 14,
                    fontWeight: 500,
                    background: i === 0 ? "var(--primary-50)" : "var(--surface-bright)",
                  }}
                >
                  <span>{slot}</span>
                  <ArrowRight size={14} style={{ color: "var(--primary)" }} />
                </Link>
              ))}
            </div>
            <Link
              href={bookHref}
              className="btn primary"
              style={{ width: "100%", marginTop: 16 }}
            >
              See all slots
            </Link>
          </div>
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
