import { ClipboardList, CalendarDays, Users, Activity } from "lucide-react";
import { requireRole } from "@/lib/auth";
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <DashboardRealtime channelKey={`receptionist:${profile.id}`} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Schedule canvas</p>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold tracking-tight">
            Welcome, {profile.full_name?.split(" ")[0] ?? "Reception"}.
          </h1>
          <p className="text-on-surface-variant mt-2">Your live overview of every clinic and every visit.</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: dateISO ? "This day" : "All time", value: counts.total, icon: CalendarDays },
          { label: "Pending", value: counts.pending, icon: Activity },
          { label: "Confirmed", value: counts.confirmed, icon: ClipboardList },
          { label: "Completed", value: counts.done, icon: Users },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface-container-low p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-headline text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Express Booking — the fastest path from “walk-in patient” to “on the schedule” */}
      <ExpressBookingPanel />

      {/* Full Day View — per-doctor bento for the focused day */}
      {doctorsWithAppointments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                Full day view
              </p>
              <h2 className="font-headline text-xl font-semibold mt-1">
                {dateISO ? `${dateISO}` : "Today"} · by doctor
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant">
              {doctorsWithAppointments.length} doctor
              {doctorsWithAppointments.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

      {/* Control bar */}
      <div className="rounded-2xl bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <NameFilter />
        <div className="flex items-center gap-2 flex-wrap">
          <DateFilter />
          <StatusFilter />
        </div>
        <div className="lg:ml-auto">
          <AddAppointmentModal clinics={clinics} />
        </div>
      </div>

      {/* Schedule */}
      <section className="rounded-[2rem] bg-surface-container-low p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h2 className="font-headline text-xl font-semibold">Appointments</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {dateISO ? `Filtered by ${dateISO}` : "All clinics"}
              {statusFilter ? ` · ${statusFilter}` : ""}
              {query ? ` · “${query}”` : ""}
              {` · ${appointments.length} row${appointments.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <AppointmentsTable appointments={appointments} />
      </section>
    </div>
  );
}
