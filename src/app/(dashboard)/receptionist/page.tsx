import { ClipboardList, CalendarDays, Users, Activity } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listClinics } from "@/lib/data/clinics";
import { getAppointmentsByRole, type AppointmentStatus } from "@/lib/data/appointments";
import { AppointmentsTable } from "@/components/receptionist/AppointmentsTable";
import { DateFilter } from "@/components/receptionist/DateFilter";
import { StatusFilter } from "@/components/receptionist/StatusFilter";
import { AddAppointmentModal } from "@/components/receptionist/AddAppointmentModal";
import { BootstrapPanel } from "@/components/receptionist/BootstrapPanel";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";

const VALID_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "done", "cancelled"];

export default async function ReceptionistPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const profile = await requireRole("receptionist");
  const sp = await searchParams;
  const dateISO = sp.date || undefined;
  const statusFilter =
    sp.status && VALID_STATUSES.includes(sp.status as AppointmentStatus)
      ? (sp.status as AppointmentStatus)
      : null;

  const [clinics, { data: allAppointments }] = await Promise.all([
    listClinics(),
    getAppointmentsByRole({ dateISO }),
  ]);

  const appointments = statusFilter
    ? allAppointments.filter((a) => a.status === statusFilter)
    : allAppointments;

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

      {/* Clinic & doctor bootstrap (collapsed) */}
      <BootstrapPanel clinics={clinics} />

      {/* Control bar */}
      <div className="rounded-2xl bg-surface-container-low p-4 flex flex-col lg:flex-row lg:items-center gap-3">
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
              {` · ${appointments.length} row${appointments.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <AppointmentsTable appointments={appointments} />
      </section>
    </div>
  );
}
