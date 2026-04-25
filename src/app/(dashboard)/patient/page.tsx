import Link from "next/link";
import {
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getAppointmentsByRole,
  type AppointmentWithRelations,
} from "@/lib/data/appointments";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";

function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function chipClassFor(status: AppointmentWithRelations["status"]) {
  if (status === "confirmed" || status === "done") return "success";
  if (status === "cancelled") return "danger";
  return "warn";
}

function chipLabelFor(status: AppointmentWithRelations["status"]) {
  if (status === "confirmed") return "Confirmed";
  if (status === "done") return "Done";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

/**
 * Patient dashboard — Clinica handoff design (PADashboard).
 *
 * Greeting header, "Upcoming" cards with reschedule/cancel,
 * then a "Past visits" list. The data wiring stays the same
 * (`getAppointmentsByRole`); only the visual layer changed.
 */
export default async function PatientPage() {
  const profile = await requireRole("patient");
  const { data: appointments } = await getAppointmentsByRole();

  const now = Date.now();
  const upcoming = appointments
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        new Date(a.appointment_date).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime(),
    );
  const past = appointments
    .filter((a) => !upcoming.includes(a))
    .sort(
      (a, b) =>
        new Date(b.appointment_date).getTime() -
        new Date(a.appointment_date).getTime(),
    )
    .slice(0, 12);

  const firstName = profile.full_name?.split(" ")[0] ?? "friend";
  const initials = (profile.full_name ?? profile.email ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <DashboardRealtime channelKey={`patient:${profile.id}`} />

      {/* Greeting */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "8px 4px 18px",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>
            Hello,
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            {firstName} 👋
          </div>
        </div>
        <Link
          href="/booking"
          className="btn primary sm"
          style={{ alignSelf: "flex-start", marginTop: 6 }}
        >
          <Plus size={14} />
          Book
        </Link>
        <span
          className="avatar"
          style={{
            width: 40,
            height: 40,
            background: "#dbeafe",
            color: "#1d4ed8",
            fontSize: 13,
            marginLeft: 12,
          }}
        >
          {initials}
        </span>
      </div>

      {/* Upcoming */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4px 10px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Upcoming</div>
        <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
          {upcoming.length}{" "}
          {upcoming.length === 1 ? "appointment" : "appointments"}
        </span>
      </div>
      {upcoming.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: "0 auto 12px",
              background: "var(--bg-muted)",
              color: "var(--text-subtle)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Calendar size={24} />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--on-surface)",
              marginBottom: 4,
            }}
          >
            No upcoming visits
          </div>
          <p className="t-small" style={{ marginBottom: 14 }}>
            Book your next appointment to see it here.
          </p>
          <Link href="/booking" className="btn primary sm">
            <Plus size={13} /> Book appointment
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {upcoming.map((a) => (
            <UpcomingCard key={a.id} appointment={a} />
          ))}
        </div>
      )}

      {/* Past visits */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4px 10px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Past visits</div>
        <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
          {past.length}
        </span>
      </div>
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        {past.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            Past visits will show up here.
          </div>
        ) : (
          past.map((a, i) => (
            <div
              key={a.id}
              style={{
                padding: "14px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderTop: i ? "1px solid var(--outline-variant)" : 0,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--bg-muted)",
                  color: "var(--text-muted)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {a.clinic?.name ?? "Clinic"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-subtle)",
                    marginTop: 2,
                  }}
                >
                  {shortDate(a.appointment_date)} ·{" "}
                  {a.doctor?.name ??
                    a.doctor?.profile?.full_name ??
                    "Doctor"}
                </div>
              </div>
              <ChevronRight size={15} style={{ color: "var(--text-faint)" }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UpcomingCard({ appointment }: { appointment: AppointmentWithRelations }) {
  const accent = "#2563EB";
  const status = appointment.status;

  return (
    <div
      className="card"
      style={{
        padding: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: `${accent}15`,
              color: accent,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {appointment.clinic?.name ?? "Clinic"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
              {appointment.doctor?.name ??
                appointment.doctor?.profile?.full_name ??
                "Doctor"}
            </div>
          </div>
        </div>
        <span
          className={`chip ${chipClassFor(status)} dot`}
          style={{ fontSize: 10 }}
        >
          {chipLabelFor(status)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: "var(--bg-muted)",
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <Calendar size={15} style={{ color: "var(--text-subtle)" }} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>
          {fmtDayLabel(appointment.appointment_date)}
        </span>
        <span
          style={{
            width: 3,
            height: 3,
            borderRadius: 999,
            background: "var(--text-faint)",
          }}
        />
        <Clock size={14} style={{ color: "var(--text-subtle)" }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {appointment.time_slot ?? fmtTime(appointment.appointment_date)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Link
          href="/booking"
          className="btn secondary sm"
          style={{ width: "100%" }}
        >
          Reschedule
        </Link>
        <Link
          href="/booking"
          className="btn secondary sm"
          style={{ width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
