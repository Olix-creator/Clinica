import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPatientHistory } from "@/lib/data/patient-history";
import { DashTopbar } from "@/components/layout/DashTopbar";

export const dynamic = "force-dynamic";

const AVATAR_PALETTE = [
  { bg: "#DBEAFE", fg: "#1D4ED8" },
  { bg: "#DCFCE7", fg: "#15803D" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#FCE7F3", fg: "#BE185D" },
  { bg: "#E0E7FF", fg: "#4338CA" },
  { bg: "#CFFAFE", fg: "#0E7490" },
];

function pickAvatar(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initialsOf(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.split("@")[0] || "U";
  return src
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtDate(iso: string): { day: string; year: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "—", year: "" };
  return {
    day: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
    year: String(d.getFullYear()),
  };
}

/**
 * Patient detail — mirrors `.design-handoff/pages/dashboard-rest.jsx → PatientDetailPage`.
 *
 *   DashTopbar (name + back link + Call / Book actions)
 *   Two-column body:
 *     left  → profile card with avatar, info rows, allergies
 *     right → visit history feed with notes
 */
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("doctor");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: profile }, history] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .eq("id", id)
      .maybeSingle(),
    getPatientHistory(id),
  ]);

  if (!profile) notFound();

  const name = profile.full_name ?? profile.email ?? "Unknown patient";
  const av = pickAvatar(name);
  const lastVisit = history.find(
    (h) => h.status === "done" || h.status === "confirmed",
  );

  return (
    <>
      <DashTopbar
        title={name}
        subtitle={
          <Link
            href="/patients"
            style={{
              color: "var(--text-subtle)",
              fontSize: 12,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={12} /> Back to patients
          </Link>
        }
        actions={
          <>
            {profile.phone ? (
              <a href={`tel:${profile.phone}`} className="btn secondary">
                <Phone size={14} /> Call
              </a>
            ) : null}
            <Link href="/search" className="btn primary">
              <Plus size={14} /> Book visit
            </Link>
          </>
        }
      />

      <div
        className="resp-page-pad resp-stack-2"
        style={{
          padding: "24px 32px 40px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 20,
        }}
      >
        {/* Left: profile */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <span
              className="avatar"
              style={{
                width: 56,
                height: 56,
                background: av.bg,
                color: av.fg,
                fontSize: 18,
              }}
            >
              {initialsOf(profile.full_name, profile.email)}
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
              <div className="t-small">
                Patient ID · {profile.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
          <hr className="sep" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginTop: 18,
            }}
          >
            <InfoRow label="Email" value={profile.email ?? "—"} />
            <InfoRow label="Phone" value={profile.phone ?? "—"} mono />
            <InfoRow
              label="Last visit"
              value={
                lastVisit
                  ? fmtDate(lastVisit.appointment_date).day +
                    ", " +
                    fmtDate(lastVisit.appointment_date).year
                  : "—"
              }
            />
            <InfoRow label="Total visits" value={String(history.length)} />
            <InfoRow
              label="Joined"
              value={
                profile.created_at
                  ? fmtDate(profile.created_at).day +
                    ", " +
                    fmtDate(profile.created_at).year
                  : "—"
              }
            />
          </div>
          <hr className="sep" style={{ margin: "20px 0" }} />
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Allergies
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="chip">None recorded</span>
          </div>
        </div>

        {/* Right: visit history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 0 }}>
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--outline-variant)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Visit history</div>
                <div className="t-small">
                  {history.length}{" "}
                  {history.length === 1 ? "appointment" : "appointments"}
                </div>
              </div>
              <button type="button" className="btn ghost sm" disabled>
                Export
              </button>
            </div>
            <div>
              {history.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--text-subtle)",
                    fontSize: 14,
                  }}
                >
                  No appointments yet.
                </div>
              ) : (
                history.map((h, i) => {
                  const date = fmtDate(h.appointment_date);
                  const docName =
                    h.doctor?.name ??
                    h.doctor?.profile?.full_name ??
                    "Doctor";
                  const reason = h.time_slot ?? "Consultation";
                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: "18px 22px",
                        borderTop: i ? "1px solid var(--outline-variant)" : 0,
                        display: "grid",
                        gridTemplateColumns: "110px 1fr",
                        gap: 20,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {date.day}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--text-subtle)" }}
                        >
                          {date.year}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            {h.clinic?.name ?? "Visit"}
                          </span>
                          <StatusChip status={h.status} />
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-subtle)",
                            marginTop: 2,
                          }}
                        >
                          {docName} · {reason}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 13,
        gap: 12,
      }}
    >
      <span style={{ color: "var(--text-subtle)" }}>{label}</span>
      <span
        style={{
          fontWeight: 500,
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
          textAlign: "right",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusChip({
  status,
}: {
  status: "pending" | "confirmed" | "done" | "cancelled" | string;
}) {
  const map: Record<string, { label: string; cls: string }> = {
    done: { label: "Done", cls: "success" },
    confirmed: { label: "Confirmed", cls: "success" },
    pending: { label: "Pending", cls: "warn" },
    cancelled: { label: "Cancelled", cls: "danger" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <span className={`chip dot ${s.cls}`}>{s.label}</span>;
}
