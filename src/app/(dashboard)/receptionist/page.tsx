import { Calendar, Check, ClipboardList, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { DashTopbar } from "@/components/layout/DashTopbar";
import { listClinics } from "@/lib/data/clinics";
import { listAllDoctors } from "@/lib/data/doctors";
import {
  getAppointmentsByRole,
  type AppointmentStatus,
  type AppointmentWithRelations,
} from "@/lib/data/appointments";
import { AppointmentsTable } from "@/components/receptionist/AppointmentsTable";
import { DateFilter } from "@/components/receptionist/DateFilter";
import { StatusFilter } from "@/components/receptionist/StatusFilter";
import { NameFilter } from "@/components/receptionist/NameFilter";
import { AddAppointmentModal } from "@/components/receptionist/AddAppointmentModal";
import { BootstrapPanel } from "@/components/receptionist/BootstrapPanel";
import ExpressBookingPanel from "@/components/receptionist/ExpressBookingPanel";
import DoctorDayColumn from "@/components/receptionist/DoctorDayColumn";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";

const VALID_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

export default async function ReceptionistPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string; q?: string }>;
}) {
  const profile = await requireRole("receptionist");
  const sp = await searchParams;
  const dateISO = sp.date || undefined;
  const query = (sp.q ?? "").trim().toLowerCase();
  const statusFilter =
    sp.status && VALID_STATUSES.includes(sp.status as AppointmentStatus)
      ? (sp.status as AppointmentStatus)
      : null;

  // Resolve "today" in the server's TZ for the per-doctor day view.
  const todayISO = new Date().toISOString().slice(0, 10);
  const viewDateISO = dateISO ?? todayISO;

  const [clinics, doctors, { data: allAppointments }, { data: dayAppointments }] = await Promise.all([
    listClinics(),
    listAllDoctors(),
    getAppointmentsByRole({ dateISO }),
    // Always also fetch the focused day (used by the per-doctor bento) so
    // the user can switch date filters without losing that view.
    getAppointmentsByRole({ dateISO: viewDateISO }),
  ]);

  // Bucket the day's appointments by doctor for the Full Day View.
  const appointmentsByDoctor = new Map<string, AppointmentWithRelations[]>();
  for (const a of dayAppointments) {
    const list = appointmentsByDoctor.get(a.doctor_id) ?? [];
    list.push(a);
    appointmentsByDoctor.set(a.doctor_id, list);
  }
  // Only show doctors that have appointments on the focused day.
  const doctorsWithAppointments = doctors
    .filter((d) => appointmentsByDoctor.has(d.id))
    .map((d) => ({
      doctor: d,
      appointments: appointmentsByDoctor.get(d.id) ?? [],
    }));

  const filtered = statusFilter
    ? allAppointments.filter((a) => a.status === statusFilter)
    : allAppointments;

  const appointments = query
    ? filtered.filter((a) => {
        const hay = [
          a.patient?.full_name,
          a.patient?.email,
          a.patient?.phone,
          a.doctor?.name,
          a.doctor?.profile?.full_name,
          a.doctor?.profile?.email,
          a.clinic?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
    : filtered;

  const counts = {
    total: allAppointments.length,
    pending: allAppointments.filter((a) => a.status === "pending").length,
    confirmed: allAppointments.filter((a) => a.status === "confirmed").length,
    done: allAppointments.filter((a) => a.status === "done").length,
  };

  const firstName = profile.full_name?.split(" ")[0] ?? "Reception";
  const subtitle = dateISO
    ? `${dateISO} · ${counts.total} appointments across all clinics`
    : `${counts.total} appointments across all clinics`;

  return (
    <>
      <DashboardRealtime channelKey={`receptionist:${profile.id}`} />
      <DashTopbar
        title={`Front desk · ${firstName}`}
        subtitle={subtitle}
        actions={<AddAppointmentModal clinics={clinics} />}
      />

      <div
        className="resp-page-pad"
        style={{
          padding: "24px 32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <StatCard
            label={dateISO ? "This day" : "All time"}
            value={counts.total}
            Ic={Calendar}
            tone="primary"
          />
          <StatCard
            label="Pending"
            value={counts.pending}
            Ic={ClipboardList}
            tone="warn"
          />
          <StatCard
            label="Confirmed"
            value={counts.confirmed}
            Ic={Check}
            tone="primary"
          />
          <StatCard
            label="Completed"
            value={counts.done}
            Ic={Users}
            tone="success"
          />
        </div>

        {/* Express Booking */}
        <ExpressBookingPanel />

        {/* Full Day View — per-doctor bento for the focused day */}
        {doctorsWithAppointments.length > 0 && (
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 4px",
              }}
            >
              <div>
                <div className="t-eyebrow">Full day view</div>
                <h2
                  style={{
                    margin: "6px 0 0",
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {dateISO ? dateISO : "Today"} · by doctor
                </h2>
              </div>
              <span className="t-small">
                {doctorsWithAppointments.length} doctor
                {doctorsWithAppointments.length === 1 ? "" : "s"}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
                gap: 16,
              }}
            >
              {doctorsWithAppointments.map(({ doctor, appointments }) => (
                <DoctorDayColumn
                  key={doctor.id}
                  doctor={doctor}
                  appointments={appointments}
                />
              ))}
            </div>
          </section>
        )}

        {/* Clinic & doctor bootstrap (collapsed) */}
        <BootstrapPanel clinics={clinics} />

        {/* Filter row */}
        <div
          className="card"
          style={{
            padding: "14px 18px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <NameFilter />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <DateFilter />
            <StatusFilter />
          </div>
        </div>

        {/* Schedule table */}
        <section
          className="card"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid var(--outline-variant)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>Appointments</div>
            <div className="t-small" style={{ marginTop: 2 }}>
              {dateISO ? `Filtered by ${dateISO}` : "All clinics"}
              {statusFilter ? ` · ${statusFilter}` : ""}
              {query ? ` · "${query}"` : ""}
              {` · ${appointments.length} row${appointments.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <div style={{ padding: "8px 12px 16px" }}>
            <AppointmentsTable appointments={appointments} />
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  Ic,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  Ic: React.ComponentType<{ size?: number }>;
  tone: "primary" | "success" | "warn" | "default";
}) {
  const tones = {
    primary: { bg: "var(--primary-50)", fg: "var(--primary-600)" },
    success: { bg: "var(--success-50)", fg: "var(--success)" },
    warn: { bg: "var(--warn-50)", fg: "var(--warn)" },
    default: { bg: "var(--bg-muted)", fg: "var(--text-muted)" },
  }[tone];
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: tones.bg,
          color: tones.fg,
          display: "grid",
          placeItems: "center",
          marginBottom: 12,
        }}
      >
        <Ic size={16} />
      </div>
      <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginTop: 2,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
